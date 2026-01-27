import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Plus, Play, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import AgentPersonaBuilder from '@/components/agents/AgentPersonaBuilder';
import AgentFeedbackPanel from '@/components/agents/AgentFeedbackPanel';
import PermissionGuard from '@/components/rbac/PermissionGuard';

export default function AgentBuilder() {
  const [currentOrg, setCurrentOrg] = useState(null);
  const [user, setUser] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testTask, setTestTask] = useState('');
  const [newAgent, setNewAgent] = useState({ name: '', description: '' });
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
      toast.success('Task completed successfully');
      queryClient.invalidateQueries({ queryKey: ['agent-executions'] });
      setTestDialogOpen(false);
      setTestTask('');
    },
    onError: (error) => {
      toast.error('Task failed: ' + error.message);
    }
  });

  return (
    <PermissionGuard permission="manage_workflows">
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">AI Agents</h1>
                <p className="text-sm text-slate-500">Build autonomous AI agents with custom personas</p>
              </div>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agents List */}
            <div className="lg:col-span-2 space-y-4">
              {agents.length === 0 ? (
                <Card className="p-8 text-center">
                  <Zap className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-4">No agents yet</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Agent
                  </Button>
                </Card>
              ) : (
                agents.map((agent) => (
                  <Card key={agent.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          {agent.persona?.role && (
                            <p className="text-sm text-slate-500 mt-1">{agent.persona.role}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAgent(agent);
                              setTestDialogOpen(true);
                            }}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAgent(agent)}
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {agent.capabilities?.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-600 mb-2">Capabilities:</p>
                            <div className="flex flex-wrap gap-1">
                              {agent.capabilities.map((cap) => (
                                <span key={cap} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                                  {cap.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {agent.performance_metrics?.total_executions > 0 && (
                          <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-100">
                            <span className="text-slate-600">
                              {agent.performance_metrics.total_executions} executions
                            </span>
                            <span className="text-green-600 font-medium">
                              {agent.performance_metrics.success_rate?.toFixed(0)}% success
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Agent Configuration */}
            <div>
              {selectedAgent ? (
                <div className="space-y-6">
                  <AgentPersonaBuilder
                    agent={selectedAgent}
                    onUpdate={(updates) => {
                      updateMutation.mutate({ id: selectedAgent.id, updates });
                      setSelectedAgent({ ...selectedAgent, ...updates });
                    }}
                  />
                  <AgentFeedbackPanel
                    agentId={selectedAgent.id}
                    orgId={currentOrg?.id}
                  />
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-slate-500">
                      Select an agent to configure
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Create Agent Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Agent</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Agent Name</Label>
                  <Input
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    placeholder="e.g., Research Assistant"
                  />
                </div>
                <Button
                  onClick={() => createMutation.mutate(newAgent)}
                  disabled={!newAgent.name || createMutation.isPending}
                  className="w-full"
                >
                  Create Agent
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Test Agent Dialog */}
          <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Test {selectedAgent?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Task</Label>
                  <Textarea
                    value={testTask}
                    onChange={(e) => setTestTask(e.target.value)}
                    placeholder="Describe the task for the agent..."
                    rows={4}
                  />
                </div>
                <Button
                  onClick={() => testMutation.mutate({ agent_id: selectedAgent.id, task: testTask })}
                  disabled={!testTask.trim() || testMutation.isPending}
                  className="w-full"
                >
                  {testMutation.isPending ? 'Executing...' : 'Run Task'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PermissionGuard>
  );
}