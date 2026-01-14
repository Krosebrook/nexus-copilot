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
              {executions.map((execution) => {
                const config = statusConfig[execution.status] || statusConfig.running;
                const Icon = config.icon;

                const hasAgentSteps = execution.step_results?.some(
                  step => step.step_type === 'ai_agent' || step.config?.action === 'ai_agent'
                );

                return (
                  <Collapsible
                    key={execution.id}
                    open={expandedExecution === execution.id}
                    onOpenChange={(open) => setExpandedExecution(open ? execution.id : null)}
                  >
                    <div className={`p-3 rounded-lg border ${config.bg} border-slate-200`}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${config.color} ${config.spin ? 'animate-spin' : ''}`} />
                            <Badge variant="outline" className="text-xs">
                              {config.label}
                            </Badge>
                            {hasAgentSteps && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                <Bot className="h-3 w-3 mr-1" />
                                AI Agent
                              </Badge>
                            )}
                            {expandedExecution === execution.id ? (
                              <ChevronDown className="h-3 w-3 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-slate-400" />
                            )}
                          </div>
                          <span className="text-xs text-slate-500">
                            {format(new Date(execution.created_date), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </CollapsibleTrigger>

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

                      <CollapsibleContent>
                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                          {execution.step_results?.map((stepResult, idx) => {
                            const isAgentStep = stepResult.step_type === 'ai_agent' || 
                                               stepResult.config?.action === 'ai_agent';
                            
                            return (
                              <div
                                key={idx}
                                className={`p-2 rounded text-xs ${
                                  isAgentStep ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {isAgentStep && <Bot className="h-3 w-3 text-blue-600" />}
                                  <span className="font-medium text-slate-700">
                                    Step {idx + 1}: {stepResult.step_type || stepResult.config?.action || 'Unknown'}
                                  </span>
                                  {stepResult.status === 'completed' && (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  )}
                                  {stepResult.status === 'failed' && (
                                    <XCircle className="h-3 w-3 text-red-500" />
                                  )}
                                  {stepResult.status === 'running' && (
                                    <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
                                  )}
                                </div>

                                {isAgentStep && (
                                  <>
                                    {stepResult.agent_goal && (
                                      <p className="text-slate-600 mb-1">
                                        <strong>Goal:</strong> {stepResult.agent_goal}
                                      </p>
                                    )}
                                    {stepResult.autonomy_level && (
                                      <p className="text-slate-600 mb-1">
                                        <strong>Autonomy:</strong> {stepResult.autonomy_level}
                                      </p>
                                    )}
                                    {stepResult.steps_taken && (
                                      <p className="text-slate-600 mb-1">
                                        <strong>Steps taken:</strong> {stepResult.steps_taken} / {stepResult.max_steps || 10}
                                      </p>
                                    )}
                                  </>
                                )}

                                {stepResult.result && (
                                  <div className="mt-1">
                                    <p className="text-slate-500 font-medium">Result:</p>
                                    <pre className="text-slate-600 mt-1 whitespace-pre-wrap overflow-auto max-h-24">
                                      {typeof stepResult.result === 'string' 
                                        ? stepResult.result 
                                        : JSON.stringify(stepResult.result, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {stepResult.error && (
                                  <p className="text-red-600 mt-1">
                                    <strong>Error:</strong> {stepResult.error}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}