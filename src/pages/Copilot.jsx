import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, History, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import CommandInput from '@/components/copilot/CommandInput';
import ResponseCard from '@/components/copilot/ResponseCard';
import ProcessingIndicator from '@/components/copilot/ProcessingIndicator';
import EmptyState from '@/components/copilot/EmptyState';
import QueryHistory from '@/components/copilot/QueryHistory';

export default function Copilot() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showHistory, setShowHistory] = useState(true);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const [currentOrg, setCurrentOrg] = useState(null);
  
  const queryClient = useQueryClient();

  // Get current user and org
  useEffect(() => {
    const fetchUserOrg = async () => {
      try {
        const user = await base44.auth.me();
        const memberships = await base44.entities.Membership.filter({ user_email: user.email, status: 'active' });
        if (memberships.length > 0) {
          const orgs = await base44.entities.Organization.filter({ id: memberships[0].org_id });
          if (orgs.length > 0) setCurrentOrg(orgs[0]);
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

  // Create query mutation
  const createQueryMutation = useMutation({
    mutationFn: async (prompt) => {
      const startTime = Date.now();
      
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

      // Gather context from knowledge base
      let knowledgeContext = '';
      const usedKnowledge = [];

      if (knowledgeBase.length > 0) {
        const contextParts = ['Organization knowledge base:'];
        
        for (const kb of knowledgeBase.slice(0, 5)) {
          contextParts.push(`\n## ${kb.title}`);
          if (kb.category) contextParts.push(`Category: ${kb.category}`);
          contextParts.push(`Content: ${kb.content.slice(0, 500)}...`);
          usedKnowledge.push(kb.id);
        }

        knowledgeContext = `\n\n${contextParts.join('\n')}\n\nUse this organization-specific knowledge to provide accurate, context-aware answers.`;
      }

      // Get AI response with all context
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful AI copilot for a team. Provide clear, concise answers. Be direct and actionable.${integrationContext}${knowledgeContext}

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

      // Log audit event
      const user = await base44.auth.me();
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
    <div className="h-screen flex bg-slate-50">
      {/* History Sidebar */}
      <AnimatePresence mode="wait">
        {showHistory && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-r border-slate-200 flex-shrink-0 overflow-hidden"
          >
            <QueryHistory
              queries={queries}
              onSelect={setSelectedQuery}
              selectedId={selectedQuery?.id}
              filter={historyFilter}
              onFilterChange={setHistoryFilter}
              searchQuery={historySearch}
              onSearchChange={setHistorySearch}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="h-8 w-8 p-0"
            >
              {showHistory ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-slate-900">Copilot</h1>
                {currentOrg && (
                  <p className="text-xs text-slate-500">{currentOrg.name}</p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {queries.length === 0 && !isProcessing ? (
              <EmptyState onSuggestionClick={handleSuggestionClick} />
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {isProcessing && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <ProcessingIndicator message="Analyzing your question..." />
                    </motion.div>
                  )}
                  
                  {selectedQuery ? (
                    <motion.div
                      key={selectedQuery.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <ResponseCard
                        query={selectedQuery}
                        onSave={(q) => toggleSaveMutation.mutate(q)}
                      />
                    </motion.div>
                  ) : (
                    queries.slice(0, 5).map((query) => (
                      <motion.div
                        key={query.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        layout
                      >
                        <ResponseCard
                          query={query}
                          onSave={(q) => toggleSaveMutation.mutate(q)}
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

        {/* Command Input */}
        <div className="border-t border-slate-200 bg-white px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <CommandInput
              onSubmit={handleSubmit}
              isProcessing={isProcessing}
              placeholder="Ask anything..."
              disabled={!currentOrg}
            />
          </div>
        </div>
      </div>
    </div>
  );
}