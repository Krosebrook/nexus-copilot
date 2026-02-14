import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Workflow, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function SubWorkflowStatusCard({ subWorkflowId, subExecutionId }) {
  const { data: workflow } = useQuery({
    queryKey: ['workflow', subWorkflowId],
    queryFn: async () => {
      const workflows = await base44.entities.Workflow.filter({ id: subWorkflowId });
      return workflows[0];
    },
    enabled: !!subWorkflowId,
  });

  const { data: execution, isLoading } = useQuery({
    queryKey: ['workflow-execution', subExecutionId],
    queryFn: async () => {
      const executions = await base44.entities.WorkflowExecution.filter({ id: subExecutionId });
      return executions[0];
    },
    enabled: !!subExecutionId,
    refetchInterval: (data) => {
      // Stop polling if completed or failed
      return data?.status === 'completed' || data?.status === 'failed' ? false : 3000;
    }
  });

  if (isLoading || !execution) {
    return (
      <Card className="border-slate-200">
        <CardContent className="pt-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = {
    running: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Running' },
    completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Completed' },
    failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Failed' },
    cancelled: { icon: AlertCircle, color: 'text-slate-600', bg: 'bg-slate-50', label: 'Cancelled' }
  };

  const config = statusConfig[execution.status] || statusConfig.running;
  const Icon = config.icon;

  const totalSteps = workflow?.steps?.length || 0;
  const completedSteps = execution.step_results?.length || 0;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <Card className="border-slate-200">
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <Workflow className="h-4 w-4 text-slate-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {workflow?.name || 'Sub-workflow'}
                </p>
                <p className="text-xs text-slate-500">
                  Execution ID: {subExecutionId.slice(0, 8)}...
                </p>
              </div>
            </div>
            <Badge variant="secondary" className={cn("text-xs", config.bg, config.color)}>
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>

          {execution.status === 'running' && (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Progress</span>
                <span>{completedSteps} / {totalSteps} steps</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          {execution.error_message && (
            <div className="p-2 bg-red-50 rounded text-xs text-red-700">
              {execution.error_message}
            </div>
          )}

          {execution.step_results && execution.step_results.length > 0 && (
            <div className="text-xs text-slate-500">
              Last step: {execution.current_step || 'Completed'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}