import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ExecutionCard from './ExecutionCard';

export default function WorkflowExecutionMonitor({ workflowId, orgId }) {
  const [expandedExecution, setExpandedExecution] = useState(null);

  const { data: executions = [], isLoading } = useQuery({
    queryKey: ['workflow-executions', workflowId],
    queryFn: () => base44.entities.WorkflowExecution.filter({ 
      workflow_id: workflowId,
      org_id: orgId 
    }, '-created_date', 20),
    enabled: !!workflowId && !!orgId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Recent Executions</CardTitle>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No executions yet
          </p>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {executions.map((execution) => (
                <ExecutionCard
                  key={execution.id}
                  execution={execution}
                  isExpanded={expandedExecution === execution.id}
                  onToggle={(open) => setExpandedExecution(open ? execution.id : null)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}