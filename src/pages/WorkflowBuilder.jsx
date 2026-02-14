import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Workflow, Plus, Play, Pause } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import WorkflowList from '@/components/workflow/WorkflowList';
import VisualWorkflowCanvas from '@/components/workflow/VisualWorkflowCanvas';
import WorkflowSidebar from '@/components/workflow/WorkflowSidebar';
import TriggerConfigDialog from '@/components/workflow/TriggerConfigDialog';
import WorkflowSuggestions from '@/components/workflow/WorkflowSuggestions';
import NextStepSuggestions from '@/components/workflow/NextStepSuggestions';
import WorkflowExecutionMonitor from '@/components/workflow/WorkflowExecutionMonitor';
import PermissionGuard, { usePermissions } from '@/components/rbac/PermissionGuard';
import WorkflowTemplates from '@/components/workflow/WorkflowTemplates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WorkflowBuilder() {
  const { can } = usePermissions();
  const [currentOrg, setCurrentOrg] = useState(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showTriggerDialog, setShowTriggerDialog] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [nextStepSuggestions, setNextStepSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const user = await base44.auth.me();
        const memberships = await base44.entities.Membership.filter({ 
          user_email: user.email, 
          status: 'active' 
        });
        if (memberships.length > 0) {
          const orgs = await base44.entities.Organization.filter({ id: memberships[0].org_id });
          if (orgs.length > 0) setCurrentOrg(orgs[0]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchOrg();
  }, []);

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.Workflow.filter({ org_id: currentOrg.id }, '-updated_date') : [],
    enabled: !!currentOrg,
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.Integration.filter({ org_id: currentOrg.id }) : [],
    enabled: !!currentOrg,
  });

  const { data: recentQueries = [] } = useQuery({
    queryKey: ['recent-queries', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.Query.filter({ org_id: currentOrg.id }, '-created_date', 20) : [],
    enabled: !!currentOrg,
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async () => {
      const workflow = await base44.entities.Workflow.create({
        org_id: currentOrg.id,
        name: 'New Workflow',
        trigger_type: 'manual',
        trigger_config: {},
        steps: [],
        is_active: false,
      });
      return workflow;
    },
    onSuccess: (workflow) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setSelectedWorkflow(workflow);
      setIsEditing(true);
      toast.success('Workflow created');
    },
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ workflowId, updates }) => {
      await base44.entities.Workflow.update(workflowId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow saved');
    },
  });

  const toggleWorkflowMutation = useMutation({
    mutationFn: async (workflow) => {
      await base44.entities.Workflow.update(workflow.id, {
        is_active: !workflow.is_active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const updateTriggerMutation = useMutation({
    mutationFn: async ({ trigger_type, trigger_config }) => {
      await base44.entities.Workflow.update(selectedWorkflow.id, {
        trigger_type,
        trigger_config,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Trigger updated');
    },
  });

  const generateSuggestions = async () => {
    if (!currentOrg) return;
    
    setLoadingSuggestions(true);
    try {
      const integrationSummary = integrations.map(i => `${i.name} (${i.type})`).join(', ');
      const queryPatterns = recentQueries.slice(0, 10).map(q => q.prompt).join('; ');
      const existingWorkflows = workflows.map(w => w.name).join(', ');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this workspace data, suggest 3 relevant workflow automation templates:

Connected Integrations: ${integrationSummary || 'None'}
Recent Copilot Queries: ${queryPatterns || 'None'}
Existing Workflows: ${existingWorkflows || 'None'}

For each suggestion, provide:
1. A clear name
2. Description
3. Trigger type (integration_event, copilot_query, schedule, or manual)
4. List of 3-5 workflow steps
5. Confidence score (0-100) based on relevance

Consider common automation patterns like:
- Notification workflows when events happen
- Scheduled reports or summaries
- Integration synchronization
- Response automation based on Copilot queries

Return only useful, practical suggestions that match their setup.`,
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  trigger_type: { type: 'string' },
                  steps: { type: 'array', items: { type: 'string' } },
                  confidence: { type: 'number' }
                }
              }
            }
          }
        }
      });

      setSuggestions(response.suggestions || []);
    } catch (e) {
      console.error('Failed to generate suggestions:', e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const generateNextSteps = async (workflow) => {
    if (!workflow) return;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `A workflow has these steps:
${workflow.steps?.map((s, i) => `${i + 1}. ${s.config?.action || 'Unknown'}`).join('\n') || 'No steps yet'}

Trigger: ${workflow.trigger_type}

Suggest 2-3 logical next steps that would make this workflow more useful. Consider:
- What happens after the current steps?
- Error handling or notifications
- Data validation or transformation
- Integration with other services

Each suggestion needs a label (step name) and reason (why it's useful).`,
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  reason: { type: 'string' },
                  action: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setNextStepSuggestions(response.suggestions || []);
    } catch (e) {
      console.error('Failed to generate next steps:', e);
    }
  };

  useEffect(() => {
    if (currentOrg && integrations.length > 0 && workflows.length >= 0) {
      generateSuggestions();
    }
  }, [currentOrg, integrations.length, workflows.length]);

  useEffect(() => {
    if (selectedWorkflow && isEditing) {
      generateNextSteps(selectedWorkflow);
    } else {
      setNextStepSuggestions([]);
    }
  }, [selectedWorkflow?.id, isEditing]);

  const applyTemplate = (suggestion) => {
    const newSteps = suggestion.steps.map((stepLabel, idx) => ({
      id: `step_${Date.now()}_${idx}`,
      type: 'action',
      config: { 
        action: inferActionType(stepLabel),
        label: stepLabel 
      },
    }));

    createWorkflowMutation.mutate();
    setTimeout(() => {
      const workflow = workflows[0];
      if (workflow) {
        updateWorkflowMutation.mutate({
          workflowId: workflow.id,
          updates: {
            name: suggestion.name,
            trigger_type: suggestion.trigger_type,
            steps: newSteps,
          }
        });
      }
    }, 500);
  };

  const addSuggestedStep = (suggestion) => {
    const newStep = {
      id: `step_${Date.now()}`,
      type: 'action',
      config: { 
        action: suggestion.action || 'send_notification',
        label: suggestion.label 
      },
    };
    
    setSelectedWorkflow({
      ...selectedWorkflow,
      steps: [...(selectedWorkflow.steps || []), newStep],
    });
  };

  const inferActionType = (label) => {
    const lower = label.toLowerCase();
    if (lower.includes('email')) return 'send_email';
    if (lower.includes('notif')) return 'send_notification';
    if (lower.includes('webhook') || lower.includes('api')) return 'webhook';
    if (lower.includes('condition') || lower.includes('if')) return 'condition';
    if (lower.includes('transform') || lower.includes('data')) return 'transform';
    if (lower.includes('delay') || lower.includes('wait')) return 'delay';
    return 'send_notification';
  };

  return (
    <PermissionGuard permission="manage_workflows" fallback={
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Workflow className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">You don't have permission to access workflow automation</p>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-slate-50">
        <div className="flex h-screen">
          {/* Workflow List Sidebar */}
          <div className="w-80 bg-white border-r border-slate-200 overflow-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold text-slate-900">Workflows</h1>
                {can('create_workflows') && (
                  <Button
                    size="sm"
                    onClick={() => createWorkflowMutation.mutate()}
                    disabled={createWorkflowMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New
                  </Button>
                )}
              </div>
            </div>

            <div className="px-4 pb-4">
              <Tabs defaultValue="suggestions" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-3">
                  <TabsTrigger value="suggestions" className="text-xs">AI Suggestions</TabsTrigger>
                  <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
                </TabsList>
                <TabsContent value="suggestions" className="mt-0">
                  <WorkflowSuggestions
                    orgId={currentOrg?.id}
                    onCreateWorkflow={(workflow) => {
                      setSelectedWorkflow(workflow);
                      setIsEditing(true);
                    }}
                  />
                </TabsContent>
                <TabsContent value="templates" className="mt-0">
                  <WorkflowTemplates
                    orgId={currentOrg?.id}
                    onSelectTemplate={(workflow) => {
                      setSelectedWorkflow(workflow);
                      setIsEditing(true);
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <WorkflowList
              workflows={workflows}
              selectedId={selectedWorkflow?.id}
              onSelect={(workflow) => {
                setSelectedWorkflow(workflow);
                setIsEditing(false);
              }}
              onToggle={(workflow) => toggleWorkflowMutation.mutate(workflow)}
            />
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex flex-col">
            {selectedWorkflow ? (
              <>
                <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{selectedWorkflow.name}</h2>
                    <p className="text-sm text-slate-500 capitalize">
                      {selectedWorkflow.trigger_type.replace('_', ' ')} trigger • 
                      {selectedWorkflow.is_active ? 'Active' : 'Inactive'} • 
                      {selectedWorkflow.execution_count || 0} runs
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {can('edit_workflows') && (
                      <>
                        <Button variant="outline" onClick={() => setShowTriggerDialog(true)}>
                          Configure Trigger
                        </Button>
                        {!isEditing ? (
                          <Button onClick={() => setIsEditing(true)}>Edit Workflow</Button>
                        ) : (
                          <Button onClick={() => {
                            updateWorkflowMutation.mutate({
                              workflowId: selectedWorkflow.id,
                              updates: selectedWorkflow,
                            });
                            setIsEditing(false);
                          }}>
                            Save Changes
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-1 flex">
                  <div className="flex-1 overflow-auto">
                    {isEditing && nextStepSuggestions.length > 0 && (
                      <div className="p-6 pb-0">
                        <NextStepSuggestions
                          workflow={selectedWorkflow}
                          suggestions={nextStepSuggestions}
                          onAdd={addSuggestedStep}
                        />
                      </div>
                    )}
                    <VisualWorkflowCanvas
                      workflow={selectedWorkflow}
                      isEditing={isEditing}
                      onUpdate={(updates) => setSelectedWorkflow({ ...selectedWorkflow, ...updates })}
                    />
                  </div>
                  <div className="w-80 border-l border-slate-200 bg-white p-4 overflow-auto">
                    {isEditing ? (
                      <WorkflowSidebar workflow={selectedWorkflow} />
                    ) : (
                      <WorkflowExecutionMonitor 
                        workflowId={selectedWorkflow.id} 
                        orgId={currentOrg?.id}
                      />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Workflow className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">Select a workflow or create a new one</p>
                  {can('create_workflows') && (
                    <Button onClick={() => createWorkflowMutation.mutate()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Workflow
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trigger Config Dialog */}
        {selectedWorkflow && (
          <TriggerConfigDialog
            open={showTriggerDialog}
            onOpenChange={setShowTriggerDialog}
            workflow={selectedWorkflow}
            onSave={(triggerConfig) => {
              updateTriggerMutation.mutate(triggerConfig);
              setSelectedWorkflow({ ...selectedWorkflow, ...triggerConfig });
            }}
          />
        )}
      </div>
    </PermissionGuard>
  );
}