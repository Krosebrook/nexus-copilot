import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, AlertCircle, Clock, Zap, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AgentFeedbackPanel from './AgentFeedbackPanel';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

const STEP_STATUS = {
  pending: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50' },
  completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  failed_replanned: { icon: RefreshCw, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  skipped: { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-50' }
};

export default function AgentExecutionDetails({ executionId, agentId, orgId }) {
  const [showFeedback, setShowFeedback] = useState(false);

  const { data: execution } = useQuery({
    queryKey: ['agent-execution', executionId],
    queryFn: () => base44.entities.AgentExecution.filter({ id: executionId }).then(r => r[0]),
    enabled: !!executionId,
  });

  if (!execution) return null;

  const hasUserFeedback = execution.user_feedback && Object.keys(execution.user_feedback).length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Plan</CardTitle>
            <Badge variant={execution.status === 'completed' ? 'default' : 'destructive'}>
              {execution.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Execution Stats */}
          {execution.result && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg text-xs">
              <div>
                <p className="text-slate-500">Chain Length</p>
                <p className="font-semibold text-slate-900">
                  {execution.result.steps?.length || 0} steps
                </p>
              </div>
              {execution.result.plan_revisions > 0 && (
                <div>
                  <p className="text-slate-500">Plan Revisions</p>
                  <p className="font-semibold text-purple-600">
                    {execution.result.plan_revisions}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Steps */}
          <div className="space-y-2">
            {execution.plan?.map((step, idx) => {
              const result = execution.result?.steps?.find(r => r.step_number === step.step_number);
              const status = result?.status || step.status || 'pending';
              const config = STEP_STATUS[status] || STEP_STATUS.pending;
              const Icon = config.icon;

              return (
                <div key={idx} className={cn("p-3 rounded-lg border", config.bg)}>
                  <div className="flex items-start gap-3">
                    <Icon className={cn("h-5 w-5 mt-0.5", config.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">
                          Step {step.step_number}: {step.description}
                        </p>
                        {result?.retry_count > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {result.retry_count} retries
                          </Badge>
                        )}
                      </div>
                      
                      {step.tool && (
                        <p className="text-xs text-slate-500 mt-1">
                          Tool: {step.tool} • Action: {step.action_type}
                        </p>
                      )}

                      {step.depends_on && step.depends_on.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          Depends on: Step {step.depends_on.join(', ')}
                        </p>
                      )}

                      {result?.error && (
                        <p className="text-xs text-red-600 mt-1">
                          Error: {result.error}
                        </p>
                      )}

                      {result?.replanned && (
                        <Badge variant="outline" className="text-xs mt-2 bg-yellow-100">
                          Plan revised after this step
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Section */}
      {execution.status === 'completed' && !hasUserFeedback && (
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFeedback(!showFeedback)}
            className="w-full"
          >
            {showFeedback ? 'Hide' : 'Provide'} Feedback to Improve Agent
          </Button>
          
          {showFeedback && (
            <div className="mt-3">
              <AgentFeedbackPanel
                execution={execution}
                agentId={agentId}
                orgId={orgId}
                onFeedbackSubmitted={() => setShowFeedback(false)}
              />
            </div>
          )}
        </div>
      )}

      {hasUserFeedback && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Feedback received</p>
                <p className="text-xs text-blue-700">Agent has learned from your input</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}