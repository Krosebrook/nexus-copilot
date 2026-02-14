import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bot, Play, CheckCircle, XCircle } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import AgentActionReview from '@/components/agents/AgentActionReview';

export default function AgentWorkflowStep({ config = {}, onChange, orgId, onTest }) {
  const [taskTemplate, setTaskTemplate] = useState(config.task_template || '');
  const [selectedAgent, setSelectedAgent] = useState(config.agent_id || '');
  const [requiresApproval, setRequiresApproval] = useState(config.requires_approval || false);
  const [testExecution, setTestExecution] = useState(null);

  const { data: agents = [] } = useQuery({
    queryKey: ['agents', orgId],
    queryFn: () => base44.entities.Agent.filter({ org_id: orgId, is_active: true }),
    enabled: !!orgId,
  });

  const handleAgentChange = (agentId) => {
    setSelectedAgent(agentId);
    onChange?.({
      agent_id: agentId,
      task_template: taskTemplate,
      requires_approval: requiresApproval,
    });
  };

  const handleTaskChange = (task) => {
    setTaskTemplate(task);
    onChange?.({
      agent_id: selectedAgent,
      task_template: task,
      requires_approval: requiresApproval,
    });
  };

  const handleApprovalChange = (checked) => {
    setRequiresApproval(checked);
    onChange?.({
      agent_id: selectedAgent,
      task_template: taskTemplate,
      requires_approval: checked,
    });
  };

  const handleTestRun = async () => {
    if (!selectedAgent || !taskTemplate) return;

    const result = await base44.functions.invoke('agentExecuteWithTools', {
      agent_id: selectedAgent,
      task: taskTemplate,
      org_id: orgId,
      context: { source: 'workflow_test' }
    });

    setTestExecution(result.data);
    onTest?.(result.data);
  };

  const selectedAgentData = agents.find(a => a.id === selectedAgent);

  return (
    <div className="space-y-4">
      <div>
        <Label>Select Agent</Label>
        <Select value={selectedAgent} onValueChange={handleAgentChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an AI agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  {agent.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedAgentData && (
          <div className="mt-2 p-2 bg-slate-50 rounded text-xs space-y-1">
            <p className="text-slate-600">
              <strong>Capabilities:</strong> {selectedAgentData.capabilities?.join(', ') || 'None'}
            </p>
            {selectedAgentData.performance_metrics && (
              <div className="flex gap-3 text-slate-500">
                <span>Success: {Math.round(selectedAgentData.performance_metrics.success_rate || 0)}%</span>
                <span>Executions: {selectedAgentData.performance_metrics.total_executions || 0}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <Label>Task Instructions</Label>
        <Textarea
          value={taskTemplate}
          onChange={(e) => handleTaskChange(e.target.value)}
          placeholder="Describe what the agent should do. Use {{variable}} for dynamic data..."
          rows={4}
          className="text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">
          Variables: {'{{trigger.data}}'}, {'{{step_1.result}}'}, {'{{workflow.id}}'}
        </p>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
        <div>
          <Label className="text-sm font-medium">Require User Approval</Label>
          <p className="text-xs text-slate-500">
            Wait for user confirmation before executing agent actions
          </p>
        </div>
        <Switch
          checked={requiresApproval}
          onCheckedChange={handleApprovalChange}
        />
      </div>

      {selectedAgent && taskTemplate && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleTestRun}
          className="w-full gap-2"
        >
          <Play className="h-4 w-4" />
          Test Agent Execution
        </Button>
      )}

      {testExecution && (
        <div className="mt-4">
          <AgentActionReview
            execution={{
              id: testExecution.execution_id,
              task: taskTemplate,
              plan: testExecution.plan,
              status: testExecution.status,
              error_message: testExecution.error,
              agent_id: selectedAgent
            }}
          />
        </div>
      )}
    </div>
  );
}