import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Plus, Play, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AgentPersonaBuilder from '@/components/agents/AgentPersonaBuilder';
import AgentFeedbackPanel from '@/components/agents/AgentFeedbackPanel';
import AgentToolManager from '@/components/agents/AgentToolManager';
import AgentLearningInsights from '@/components/agents/AgentLearningInsights';
import ExecutionFeedbackDialog from '@/components/agents/ExecutionFeedbackDialog';
import ExecutionPlanViewer from '@/components/agents/ExecutionPlanViewer';
import PermissionGuard from '@/components/rbac/PermissionGuard';

export default function AgentBuilder() {
  const [currentOrg, setCurrentOrg] = useState(null);
  const [user, setUser] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testTask, setTestTask] = useState('');
  const [newAgent, setNewAgent] = useState({ name: '', description: '' });
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [completedExecution, setCompletedExecution] = useState(null);
  const [monitoringExecution, setMonitoringExecution] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        const memberships = await base44.entities.Membership.filter({ 
          user_email: userData.email, 
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
    fetchData();
  }, []);

  const { data: agents = [] } = useQuery({
    queryKey: ['agents', currentOrg?.id],
    queryFn: () => base44.entities.Agent.filter({ org_id: currentOrg.id }),
    enabled: !!currentOrg
  });

  const createMutation = useMutation({
    mutationFn: async (agentData) => {
      await base44.entities.Agent.create({
        org_id: currentOrg.id,
        ...agentData,
        capabilities: ['multi_step_planning', 'web_search'],
        persona: {
          role: '',
          tone: 'professional',
          expertise_areas: [],
          custom_instructions: ''
        },
        performance_metrics: {
          total_executions: 0,
          success_rate: 0,
          avg_execution_time_ms: 0,
          user_satisfaction_avg: 0
        }
      });
    },
    onSuccess: () => {
      toast.success('Agent created');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setCreateDialogOpen(false);
      setNewAgent({ name: '', description: '' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      await base44.entities.Agent.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent updated');
    }
  });

  const testMutation = useMutation({
    mutationFn: async ({ agent_id, task }) => {
      const response = await base44.functions.invoke('agentExecute', {
        agent_id,
        task,
        org_id: currentOrg.id
      });
      return response.data;
    },
    onSuccess: (result) => {
      // If execution completed, fetch full details and show feedback
      if (result.status === 'completed') {
        base44.entities.AgentExecution.filter({ id: result.execution_id }).then(execs => {
          if (execs.length > 0) {
            setCompletedExecution(execs[0]);
            setFeedbackDialogOpen(true);
          }
        });
        toast.success('Task completed successfully');
      } else if (result.status === 'awaiting_approval') {
        toast.info('Task requires approval to continue');
      }
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setTestDialogOpen(false);
      setTestTask('');
      setMonitoringExecution(null);
    },
    onError: (error) => {
      toast.error('Task failed: ' + error.message);
      setMonitoringExecution(null);
    }
  });

  const handleTestAgent = () => {
    if (!selectedAgent || !testTask) {
      toast.error('Please select agent and enter a task');
      return;
    }
    // Start monitoring
    setMonitoringExecution('starting');
    testMutation.mutate({ agent_id: selectedAgent.id, task: testTask });
  };

  return (
    <PermissionGuard permission="manage_workflows">
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Agent Builder</h1>
              <p className="text-slate-500">Create and manage AI agents with advanced capabilities</p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </div>

          {/* Agent Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={setSelectedAgent}
                onTest={() => {
                  setSelectedAgent(agent);
                  setTestDialogOpen(true);
                }}
              />
            ))}
          </div>

          {/* Create Agent Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Agent</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Agent Name</Label>
                  <Input
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    placeholder="e.g., Data Analysis Agent"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newAgent.description}
                    onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                    placeholder="What does this agent do?"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => createMutation.mutate(newAgent)}>
                  Create Agent
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Test Agent Dialog */}
          <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Test Agent: {selectedAgent?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Task</Label>
                  <Textarea
                    value={testTask}
                    onChange={(e) => setTestTask(e.target.value)}
                    placeholder="Enter a task for the agent to execute..."
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleTestAgent}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? (
                    <>
                      <Zap className="h-4 w-4 mr-2 animate-pulse" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Task
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Agent Dialog */}
          {selectedAgent && !testDialogOpen && (
            <EditAgentDialog
              agent={selectedAgent}
              orgId={currentOrg?.id}
              onClose={() => setSelectedAgent(null)}
              onUpdate={(updates) => updateMutation.mutate({ id: selectedAgent.id, updates })}
            />
          )}

          {/* Feedback Dialog */}
          {completedExecution && (
            <ExecutionFeedbackDialog
              execution={completedExecution}
              open={feedbackDialogOpen}
              onClose={() => {
                setFeedbackDialogOpen(false);
                setCompletedExecution(null);
              }}
            />
          )}

          {/* Execution Monitoring Dialog */}
          {monitoringExecution && testMutation.data?.execution_id && (
            <Dialog open={!!monitoringExecution} onOpenChange={() => setMonitoringExecution(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Execution Monitor</DialogTitle>
                </DialogHeader>
                <ExecutionPlanViewer 
                  executionId={testMutation.data.execution_id} 
                  showLive={true}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
}

function AgentCard({ agent, onEdit, onTest }) {
  const successRate = agent.performance_metrics?.success_rate || 0;
  const totalExecs = agent.performance_metrics?.total_executions || 0;
  const avgTime = agent.performance_metrics?.avg_execution_time_ms || 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base">{agent.name}</CardTitle>
              <p className="text-xs text-slate-500">{agent.description}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onEdit(agent)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Success Rate</span>
            <span className="font-medium">{Math.round(successRate)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Executions</span>
            <span className="font-medium">{totalExecs}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Avg Time</span>
            <span className="font-medium">{Math.round(avgTime)}ms</span>
          </div>
          <Button className="w-full" size="sm" onClick={onTest}>
            <Play className="h-4 w-4 mr-2" />
            Test Agent
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EditAgentDialog({ agent, orgId, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('persona');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Agent: {agent.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="persona">Persona</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
          </TabsList>

          <TabsContent value="persona" className="space-y-4 mt-4">
            <AgentPersonaBuilder
              agent={agent}
              onUpdate={onUpdate}
            />
          </TabsContent>

          <TabsContent value="tools" className="mt-4">
            <AgentToolManager
              agentId={agent.id}
              orgId={orgId}
              currentTools={agent.available_tools || []}
              onUpdate={onUpdate}
            />
          </TabsContent>

          <TabsContent value="learning" className="mt-4">
            <AgentLearningInsights
              agent={agent}
              orgId={orgId}
            />
          </TabsContent>

          <TabsContent value="approvals" className="space-y-4 mt-4">
            <ApprovalSettings
              agent={agent}
              onUpdate={onUpdate}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ApprovalSettings({ agent, onUpdate }) {
  const [requiresApproval, setRequiresApproval] = useState(agent.requires_human_approval || false);
  const [approvalSteps, setApprovalSteps] = useState(agent.approval_steps || []);

  const handleSave = () => {
    onUpdate({
      requires_human_approval: requiresApproval,
      approval_steps: approvalSteps
    });
    toast.success('Approval settings updated');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Human-in-the-Loop Settings</h3>
        <p className="text-sm text-slate-500">
          Configure which agent steps require human approval before execution
        </p>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <Label className="text-base font-medium">Require Human Approval</Label>
          <p className="text-sm text-slate-500 mt-1">
            Enable manual approval for sensitive operations
          </p>
        </div>
        <Switch
          checked={requiresApproval}
          onCheckedChange={setRequiresApproval}
        />
      </div>

      {requiresApproval && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Approval Steps</CardTitle>
            <CardDescription>
              Select which steps in the agent's execution plan require approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(step => (
                <div key={step} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={approvalSteps.includes(`step_${step}`)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setApprovalSteps([...approvalSteps, `step_${step}`]);
                      } else {
                        setApprovalSteps(approvalSteps.filter(s => s !== `step_${step}`));
                      }
                    }}
                    className="rounded"
                  />
                  <Label className="text-sm">Step {step}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave}>
        Save Approval Settings
      </Button>
    </div>
  );
}