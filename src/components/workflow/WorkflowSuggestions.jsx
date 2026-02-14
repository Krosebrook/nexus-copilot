import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AIGlyph from '@/components/shared/AIGlyph';
import { toast } from "sonner";

export default function WorkflowSuggestions({ orgId, onCreateWorkflow }) {
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['workflow-suggestions', orgId],
    queryFn: async () => {
      // Fetch user activity patterns
      const queries = await base44.entities.Query.filter({ org_id: orgId }, '-created_date', 100);
      const integrations = await base44.entities.Integration.filter({ org_id: orgId, status: 'active' });
      const auditLogs = await base44.entities.AuditLog.filter({ org_id: orgId }, '-created_date', 200);

      // Analyze patterns and generate suggestions
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this workspace activity and suggest 3-4 practical workflow automations. Return only JSON.

Active integrations: ${integrations.map(i => i.type).join(', ')}
Common query types: ${queries.slice(0, 20).map(q => q.response_type).join(', ')}
Frequent actions: ${auditLogs.slice(0, 30).map(l => l.action).join(', ')}

For each suggestion, provide:
- name (short, actionable)
- description (one sentence)
- trigger (what starts it)
- actions (array of 2-3 steps)
- impact (time saved or benefit)
- difficulty (easy/medium)

Example format:
{
  "suggestions": [{
    "name": "Auto-share insights to Slack",
    "description": "Post important query responses to your team channel",
    "trigger": "When query is saved",
    "actions": ["Detect saved query", "Format response", "Post to Slack"],
    "impact": "Share knowledge instantly",
    "difficulty": "easy"
  }]
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  trigger: { type: 'string' },
                  actions: { type: 'array', items: { type: 'string' } },
                  impact: { type: 'string' },
                  difficulty: { type: 'string' }
                }
              }
            }
          }
        }
      });

      return response?.suggestions || [];
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (suggestion) => {
      const workflow = await base44.entities.Workflow.create({
        org_id: orgId,
        name: suggestion.name,
        description: suggestion.description,
        trigger_type: 'entity_event',
        trigger_config: {
          entity_name: 'Query',
          event_types: ['update'],
        },
        steps: suggestion.actions.map((action, idx) => ({
          id: `step_${idx}`,
          type: 'action',
          config: {
            description: action,
          },
          position: { x: idx * 200, y: 100 }
        })),
        is_active: false,
      });
      return workflow;
    },
    onSuccess: (workflow, suggestion) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow template created', {
        description: 'Configure the details and activate it',
        action: {
          label: 'Configure',
          onClick: () => onCreateWorkflow?.(workflow)
        }
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-700">
            <AIGlyph size="sm" animated />
            AI Workflow Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-700">
          <AIGlyph size="sm" />
          AI Workflow Suggestions
        </CardTitle>
        <p className="text-sm text-slate-500">Based on your team's activity patterns</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border border-slate-200 hover:shadow-md transition-all duration-200">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-700">{suggestion.name}</h3>
                        <Badge variant={suggestion.difficulty === 'easy' ? 'secondary' : 'outline'} className="text-xs">
                          {suggestion.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{suggestion.description}</p>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Zap className="h-3 w-3" />
                          <span>Trigger: {suggestion.trigger}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.actions.map((action, i) => (
                            <React.Fragment key={i}>
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                {action}
                              </span>
                              {i < suggestion.actions.length - 1 && (
                                <ArrowRight className="h-3 w-3 text-slate-400 self-center" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-green-600 font-medium">💡 {suggestion.impact}</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => createWorkflowMutation.mutate(suggestion)}
                    disabled={createWorkflowMutation.isPending}
                    className="w-full bg-slate-900 hover:bg-slate-800 mt-3"
                  >
                    Create This Workflow
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}