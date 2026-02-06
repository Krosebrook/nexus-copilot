import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Clock, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function ExecutionPlanViewer({ executionId, showLive = false }) {
  const [execution, setExecution] = useState(null);

  useEffect(() => {
    const fetchExecution = async () => {
      const execs = await base44.entities.AgentExecution.filter({ id: executionId });
      if (execs.length > 0) setExecution(execs[0]);
    };
    fetchExecution();

    // Live updates
    if (showLive) {
      const interval = setInterval(fetchExecution, 2000);
      return () => clearInterval(interval);
    }
  }, [executionId, showLive]);

  if (!execution) {
    return <div className="text-slate-500 text-sm">Loading execution plan...</div>;
  }

  const plan = execution.plan || [];
  const completedSteps = plan.filter(s => s.status === 'completed').length;
  const progress = plan.length > 0 ? (completedSteps / plan.length) * 100 : 0;

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'awaiting_approval':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStepBadge = (status) => {
    const variants = {
      completed: 'default',
      running: 'secondary',
      failed: 'destructive',
      awaiting_approval: 'outline',
      pending: 'outline'
    };
    return variants[status] || 'outline';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Execution Plan</CardTitle>
          <Badge variant={getStepBadge(execution.status)}>
            {execution.status}
          </Badge>
        </div>
        {plan.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span>Progress</span>
              <span>{completedSteps} of {plan.length} steps</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {plan.length === 0 ? (
            <p className="text-sm text-slate-500">Planning in progress...</p>
          ) : (
            plan.map((step, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  step.status === 'running' ? 'border-blue-300 bg-blue-50' :
                  step.status === 'completed' ? 'border-green-200 bg-green-50' :
                  step.status === 'failed' ? 'border-red-200 bg-red-50' :
                  'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getStepIcon(step.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-900">
                        Step {step.step_number}: {step.action}
                      </p>
                      {step.duration_ms && (
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {(step.duration_ms / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{step.description}</p>
                    
                    {step.result && step.status === 'completed' && (
                      <div className="mt-2 p-2 bg-white rounded text-xs text-slate-700">
                        <span className="font-medium">Result: </span>
                        {typeof step.result === 'string' 
                          ? step.result.substring(0, 100) + (step.result.length > 100 ? '...' : '')
                          : JSON.stringify(step.result).substring(0, 100)
                        }
                      </div>
                    )}

                    {step.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        <span className="font-medium">Error: </span>
                        {step.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {execution.result && execution.status === 'completed' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-2">Final Result</p>
            <p className="text-sm text-green-700">
              Task completed successfully in {(execution.execution_time_ms / 1000).toFixed(1)} seconds
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}