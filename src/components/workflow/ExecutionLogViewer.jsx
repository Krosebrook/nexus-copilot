import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { PlayCircle, CheckCircle2, XCircle, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import moment from 'moment';

const STATUS_CONFIG = {
  running: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Running' },
  completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Failed' },
  cancelled: { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Cancelled' },
};

export default function ExecutionLogViewer({ execution, workflow, onRerun }) {
  const [liveExecution, setLiveExecution] = useState(execution);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!execution?.id) return;

    const unsubscribe = base44.entities.WorkflowExecution.subscribe((event) => {
      if (event.id === execution.id && event.type === 'update') {
        setLiveExecution(event.data);
      }
    });

    return unsubscribe;
  }, [execution?.id]);

  const statusConfig = STATUS_CONFIG[liveExecution?.status] || STATUS_CONFIG.running;
  const StatusIcon = statusConfig.icon;

  const getStepInfo = (stepId) => {
    return workflow?.steps?.find(s => s.id === stepId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <PlayCircle className="h-4 w-4" />
            Execution Log
          </CardTitle>
          {liveExecution?.status === 'failed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRerun?.(liveExecution)}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Execution Status */}
        <div className={cn("rounded-lg p-3 mb-4", statusConfig.bg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
              <span className={cn("font-medium", statusConfig.color)}>
                {statusConfig.label}
              </span>
            </div>
            <span className="text-xs text-slate-600">
              {moment(liveExecution?.created_date).format('MMM D, h:mm A')}
            </span>
          </div>
          {liveExecution?.error_message && (
            <p className="text-sm text-red-700 mt-2">
              {liveExecution.error_message}
            </p>
          )}
        </div>

        {/* Step Results */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">Step Results:</p>
          {liveExecution?.step_results?.length > 0 ? (
            <div className="space-y-2">
              {liveExecution.step_results.map((result, idx) => {
                const stepInfo = getStepInfo(result.step_id);
                const isSuccess = result.status === 'success';
                const isFailed = result.status === 'failed';

                return (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-lg border p-3",
                      isSuccess && "bg-green-50 border-green-200",
                      isFailed && "bg-red-50 border-red-200",
                      !isSuccess && !isFailed && "bg-slate-50 border-slate-200"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isSuccess && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {isFailed && <XCircle className="h-4 w-4 text-red-600" />}
                        <span className="text-sm font-medium text-slate-900">
                          {stepInfo?.config?.label || `Step ${idx + 1}`}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {result.duration_ms}ms
                      </Badge>
                    </div>

                    {result.error && (
                      <p className="text-xs text-red-700 mb-2">
                        Error: {result.error}
                      </p>
                    )}

                    {result.retry_count && (
                      <p className="text-xs text-orange-700 mb-2">
                        Succeeded after {result.retry_count} retries
                      </p>
                    )}

                    {result.result && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-slate-600 hover:text-slate-900">
                          View output
                        </summary>
                        <pre className="mt-2 p-2 bg-white rounded border border-slate-200 overflow-auto">
                          {JSON.stringify(result.result, null, 2)}
                        </pre>
                      </details>
                    )}

                    <p className="text-xs text-slate-500 mt-1">
                      {moment(result.timestamp).format('h:mm:ss A')}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              {liveExecution?.status === 'running' ? 'Executing...' : 'No steps executed'}
            </p>
          )}
        </div>

        {/* Current Step Indicator */}
        {liveExecution?.status === 'running' && liveExecution?.current_step && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              Currently executing: {getStepInfo(liveExecution.current_step)?.config?.label || 'Unknown step'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}