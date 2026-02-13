import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import CommandInput from '@/components/copilot/CommandInput';
import ResponseCard from '@/components/copilot/ResponseCard';
import ProcessingIndicator from '@/components/copilot/ProcessingIndicator';
import EmptyState from '@/components/copilot/EmptyState';
import QueryHistory from '@/components/copilot/QueryHistory';
import SuggestedArticles from '@/components/copilot/SuggestedArticles';

export default function Copilot() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const [currentOrg, setCurrentOrg] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [preferences, setPreferences] = useState(null);
  
  const queryClient = useQueryClient();

  // Get current user and org
  useEffect(() => {
    const fetchUserOrg = async () => {
      try {
        const user = await base44.auth.me();
        const memberships = await base44.entities.Membership.filter({ user_email: user.email, status: 'active' });
        if (memberships.length > 0) {
          const orgs = await base44.entities.Organization.filter({ id: memberships[0].org_id });
          if (orgs.length > 0) {
            setCurrentOrg(orgs[0]);
            
            // Load user preferences
            const prefs = await base44.entities.UserPreferences.filter({ 
              user_email: user.email, 
              org_id: orgs[0].id 
            });
            if (prefs.length > 0) {
              setPreferences(prefs[0]);
            }
            
            // Load or create active session
            const sessions = await base44.entities.ConversationSession.filter({
              user_email: user.email,
              org_id: orgs[0].id,
              is_active: true
            }, '-last_activity', 1);
            
            if (sessions.length > 0) {
              setCurrentSession(sessions[0]);
            }
          }
        }
      } catch (e) {
        // User might not have org yet
      }
    };
    fetchUserOrg();
  }, []);

  // Fetch queries
  const { data: queries = [], isLoading } = useQuery({
    queryKey: ['queries', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.Query.filter({ org_id: currentOrg.id }, '-created_date', 100) : [],
    enabled: !!currentOrg,
  });

  // Fetch active integrations
  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.Integration.filter({ org_id: currentOrg.id, status: 'active' }) : [],
    enabled: !!currentOrg,
  });

  // Fetch active knowledge base
  const { data: knowledgeBase = [] } = useQuery({
    queryKey: ['knowledge', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.KnowledgeBase.filter({ org_id: currentOrg.id, is_active: true }) : [],
    enabled: !!currentOrg,
  });

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ query, feedback }) => {
      const user = await base44.auth.me();
      await base44.entities.QueryFeedback.create({
        query_id: query.id,
        org_id: currentOrg.id,
        user_email: user.email,
        ...feedback,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queries'] });
    },
  });

  // Create query mutation
  const createQueryMutation = useMutation({
    mutationFn: async (prompt) => {
      const startTime = Date.now();
      const user = await base44.auth.me();
      
      // Build conversation context from current session
      let conversationContext = '';
      if (currentSession?.query_ids?.length > 0) {
        const recentQueries = queries.filter(q => 
          currentSession.query_ids.includes(q.id)
        ).slice(-3);
        
        if (recentQueries.length > 0) {
          conversationContext = '\n\nPrevious conversation:\n' + 
            recentQueries.map(q => `User: ${q.prompt}\nAssistant: ${q.response?.slice(0, 200)}...`).join('\n\n');
        }
      }
      
      // Create query record
      const query = await base44.entities.Query.create({
        org_id: currentOrg.id,
        prompt,
        status: 'processing',
        response_type: detectResponseType(prompt),
      });

      // Gather context from active integrations
      let integrationContext = '';
      const usedIntegrations = [];

      if (integrations.length > 0) {
        const contextParts = ['Available integrations for context:'];
        
        for (const integration of integrations) {
          contextParts.push(`- ${integration.name} (${integration.type}): ${integration.capabilities?.join(', ') || 'connected'}`);
          usedIntegrations.push({
            integration_id: integration.id,
            integration_type: integration.type,
            data_used: `Connected ${integration.type} workspace`,
          });
        }

        integrationContext = `\n\n${contextParts.join('\n')}\n\nYou can reference these tools if relevant to the user's question.`;
      }

      // Gather context from knowledge base with graph traversal
      let knowledgeContext = '';
      const usedKnowledge = [];

      if (knowledgeBase.length > 0) {
        // Find most relevant articles (could be enhanced with semantic search)
        const relevantArticles = knowledgeBase.slice(0, 3);
        const contextParts = ['Organization knowledge base:'];

        for (const kb of relevantArticles) {
          contextParts.push(`\n## ${kb.title}`);
          if (kb.category) contextParts.push(`Category: ${kb.category}`);
          contextParts.push(`Content: ${kb.content.slice(0, 500)}...`);
          usedKnowledge.push(kb.id);

          // Include linked articles for context
          if (kb.linked_articles?.length > 0) {
            const linkedTitles = kb.linked_articles
              .map(id => knowledgeBase.find(a => a.id === id)?.title)
              .filter(Boolean);
            if (linkedTitles.length > 0) {
              contextParts.push(`Related articles: ${linkedTitles.join(', ')}`);
            }
          }

          // Include backlinks
          if (kb.backlinks?.length > 0) {
            const backlinkTitles = kb.backlinks
              .map(id => knowledgeBase.find(a => a.id === id)?.title)
              .filter(Boolean);
            if (backlinkTitles.length > 0) {
              contextParts.push(`Referenced by: ${backlinkTitles.join(', ')}`);
            }
          }
        }

        knowledgeContext = `\n\n${contextParts.join('\n')}\n\nUse this organization-specific knowledge to provide accurate, context-aware answers. When citing information, mention the article title.`;
      }

      // Apply user preferences to prompt
      const lengthInstruction = preferences?.copilot_response_length === 'concise' 
        ? ' Keep responses brief and to the point.' 
        : preferences?.copilot_response_length === 'detailed' 
        ? ' Provide detailed, comprehensive explanations.' 
        : ' Balance brevity with completeness.';
      
      const verbosityInstruction = preferences?.copilot_verbosity === 'minimal'
        ? ' Use minimal technical jargon.'
        : preferences?.copilot_verbosity === 'verbose'
        ? ' Include technical details and explanations.'
        : ' Use clear, professional language.';
      
      // Update processing status
      setIsProcessing(true);

      // Get AI response with all context
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful AI copilot for a team. Provide clear, concise answers. Be direct and actionable.${lengthInstruction}${verbosityInstruction}${integrationContext}${knowledgeContext}${conversationContext}

User question: ${prompt}

Respond in a helpful, professional manner. Use markdown for formatting when appropriate.`,
        add_context_from_internet: prompt.toLowerCase().includes('latest') || prompt.toLowerCase().includes('news'),
      });

      const latency = Date.now() - startTime;

      // Update query with response and integration references
      await base44.entities.Query.update(query.id, {
        response: response,
        status: 'completed',
        latency_ms: latency,
        integration_refs: usedIntegrations.length > 0 ? usedIntegrations : undefined,
        context_refs: usedKnowledge.length > 0 ? usedKnowledge : undefined,
      });

      // Update knowledge base usage
      if (usedKnowledge.length > 0) {
        for (const kbId of usedKnowledge) {
          await base44.entities.KnowledgeBase.update(kbId, {
            usage_count: (knowledgeBase.find(kb => kb.id === kbId)?.usage_count || 0) + 1,
            last_used_at: new Date().toISOString(),
          });
        }
      }

      // Update or create session
      if (currentSession) {
        await base44.entities.ConversationSession.update(currentSession.id, {
          query_ids: [...(currentSession.query_ids || []), query.id],
          last_activity: new Date().toISOString(),
        });
      } else {
        const newSession = await base44.entities.ConversationSession.create({
          org_id: currentOrg.id,
          user_email: user.email,
          title: prompt.slice(0, 50),
          query_ids: [query.id],
          is_active: true,
          last_activity: new Date().toISOString(),
        });
        setCurrentSession(newSession);
      }

      // Log audit event
      await base44.entities.AuditLog.create({
        org_id: currentOrg.id,
        actor_email: user.email,
        action: 'query_created',
        action_category: 'query',
        resource_type: 'Query',
        resource_id: query.id,
        status: 'success',
        details: {
          integrations_used: usedIntegrations.length,
          knowledge_docs_used: usedKnowledge.length,
        },
      });

      return { ...query, response, latency_ms: latency, status: 'completed', integration_refs: usedIntegrations, context_refs: usedKnowledge };
    },
    onSuccess: (newQuery) => {
      queryClient.invalidateQueries({ queryKey: ['queries'] });
      setSelectedQuery(newQuery);
    },
    onError: (error) => {
      toast.error('Failed to process query');
      console.error(error);
    },
  });

  // Save/unsave query
  const toggleSaveMutation = useMutation({
    mutationFn: async (query) => {
      await base44.entities.Query.update(query.id, { is_saved: !query.is_saved });
      return { ...query, is_saved: !query.is_saved };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queries'] });
    },
  });

  const detectResponseType = (prompt) => {
    const lower = prompt.toLowerCase();
    if (lower.includes('summarize') || lower.includes('summary')) return 'summary';
    if (lower.includes('action') || lower.includes('todo') || lower.includes('tasks')) return 'action';
    if (lower.includes('compare') || lower.includes('analyze') || lower.includes('analysis')) return 'analysis';
    if (lower.includes('what') || lower.includes('how') || lower.includes('why')) return 'answer';
    return 'answer';
  };

  const handleSubmit = async (prompt) => {
    if (!currentOrg) {
      toast.error('Please set up your organization first');
      return;
    }
    setIsProcessing(true);
    try {
      await createQueryMutation.mutateAsync(prompt);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (text) => {
    handleSubmit(text);
  };

  // Keyboard shortcut for history toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setShowHistory(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen flex bg-white">
      {/* History Sidebar Overlay */}
      <AnimatePresence mode="wait">
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/20 z-40"
              onClick={() => setShowHistory(false)}
            />
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white border-r border-slate-200 z-50 shadow-xl"
            >
              <QueryHistory
                queries={queries}
                onSelect={(q) => {
                  setSelectedQuery(q);
                  setShowHistory(false);
                }}
                selectedId={selectedQuery?.id}
                filter={historyFilter}
                onFilterChange={setHistoryFilter}
                searchQuery={historySearch}
                onSearchChange={setHistorySearch}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Input-First Header */}
        <header className="border-b border-slate-200 bg-white px-6 py-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="h-8 w-8 p-0"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
                    <AIGlyph size="sm" className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-slate-700">Copilot</h1>
                    {currentOrg && (
                      <p className="text-xs text-slate-500">{currentOrg.name}</p>
                    )}
                  </div>
                </div>
              </div>
              {queries.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(true)}
                  className="text-xs text-slate-500"
                >
                  {queries.length} {queries.length === 1 ? 'query' : 'queries'}
                </Button>
              )}
            </div>

            {/* Hero Command Input */}
            <CommandInput
              onSubmit={handleSubmit}
              isProcessing={isProcessing}
              placeholder="Ask anything..."
              disabled={!currentOrg}
            />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-50">
          <div className="max-w-3xl mx-auto px-6 py-6">
            {queries.length === 0 && !isProcessing ? (
              <EmptyState onSuggestionClick={handleSuggestionClick} />
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {isProcessing && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <ProcessingIndicator message="Analyzing your question..." />
                    </motion.div>
                  )}
                  
                  {selectedQuery ? (
                    <motion.div
                      key={selectedQuery.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <ResponseCard
                        query={selectedQuery}
                        onSave={(q) => toggleSaveMutation.mutate(q)}
                        onFeedback={(q, feedback) => submitFeedbackMutation.mutate({ query: q, feedback })}
                      />
                      {preferences?.copilot_show_sources && (
                        <SuggestedArticles 
                          query={selectedQuery.prompt} 
                          orgId={currentOrg?.id}
                        />
                      )}
                    </motion.div>
                  ) : (
                    queries.slice(0, 5).map((query) => (
                      <motion.div
                        key={query.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        layout
                      >
                        <ResponseCard
                          query={query}
                          onSave={(q) => toggleSaveMutation.mutate(q)}
                          onFeedback={(q, feedback) => submitFeedbackMutation.mutate({ query: q, feedback })}
                          compact
                        />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}