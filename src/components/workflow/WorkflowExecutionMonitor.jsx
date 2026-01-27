import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExecutionCard from './ExecutionCard';
import ExecutionLogViewer from './ExecutionLogViewer';

export default function WorkflowExecutionMonitor({ workflowId, orgId }) {
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [liveExecutions, setLiveExecutions] = useState([]);

  const { data: executions = [], isLoading } = useQuery({
    queryKey: ['workflow-executions', workflowId],
    queryFn: () => base44.entities.WorkflowExecution.filter(
      { workflow_id: workflowId },
      '-created_date',
      20
    ),
    enabled: !!workflowId,
  });

  const { data: workflow } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => base44.entities.Workflow.filter({ id: workflowId }).then(w => w[0]),
    enabled: !!workflowId,
  });

  // Real-time updates via subscription
  useEffect(() => {
    if (!workflowId) return;

    const unsubscribe = base44.entities.WorkflowExecution.subscribe((event) => {
      if (event.data?.workflow_id === workflowId) {
        setLiveExecutions(prev => {
          const updated = [...prev];
          const index = updated.findIndex(e => e.id === event.id);
          
          if (event.type === 'create') {
            updated.unshift(event.data);
          } else if (event.type === 'update' && index >= 0) {
            updated[index] = event.data;
          } else if (event.type === 'delete' && index >= 0) {
            updated.splice(index, 1);
          }
          
          return updated.slice(0, 20);
        });
      }
    });

    return unsubscribe;
  }, [workflowId]);

  // Merge live updates with fetched data
  const displayExecutions = liveExecutions.length > 0 ? liveExecutions : executions;

  const handleRerun = async (execution) => {
    try {
      await base44.functions.invoke('workflowExecute', {
        workflow_id: workflowId,
        trigger_data: execution.trigger_data
      });
    } catch (error) {
      console.error('Failed to rerun workflow:', error);
    }
  };

  if (selectedExecution) {
    return (
      <ExecutionLogViewer
        execution={selectedExecution}
        workflow={workflow}
        onRerun={handleRerun}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Recent Executions
          {displayExecutions.some(e => e.status === 'running') && (
            <span className="ml-2 h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : displayExecutions.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            No executions yet
          </p>
        ) : (
          <div className="space-y-3">
            {displayExecutions.map((execution) => (
              <div
                key={execution.id}
                onClick={() => setSelectedExecution(execution)}
                className="cursor-pointer"
              >
                <ExecutionCard execution={execution} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}