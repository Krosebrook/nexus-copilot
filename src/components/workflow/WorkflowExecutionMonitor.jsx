import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function WorkflowExecutionMonitor({ workflowId, orgId }) {
  const { data: executions = [], isLoading } = useQuery({
    queryKey: ['workflow-executions', workflowId],
    queryFn: () => base44.entities.WorkflowExecution.filter({ 
      workflow_id: workflowId,
      org_id: orgId 
    }, '-created_date', 20),
    enabled: !!workflowId && !!orgId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const statusConfig = {
    running: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Running', spin: true },
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Completed' },
    failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Failed' },
    cancelled: { icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-50', label: 'Cancelled' },
  };

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
              {executions.map((execution) => {
                const config = statusConfig[execution.status] || statusConfig.running;
                const Icon = config.icon;

                return (
                  <div
                    key={execution.id}
                    className={`p-3 rounded-lg border ${config.bg} border-slate-200`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${config.color} ${config.spin ? 'animate-spin' : ''}`} />
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-500">
                        {format(new Date(execution.created_date), 'MMM d, h:mm a')}
                      </span>
                    </div>

                    {execution.current_step && (
                      <p className="text-xs text-slate-600 mb-1">
                        Current: <span className="font-medium">{execution.current_step}</span>
                      </p>
                    )}

                    {execution.step_results?.length > 0 && (
                      <p className="text-xs text-slate-500">
                        {execution.step_results.length} steps completed
                      </p>
                    )}

                    {execution.error_message && (
                      <p className="text-xs text-red-600 mt-2">
                        Error: {execution.error_message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}