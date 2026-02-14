import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, TrendingUp, AlertTriangle, Zap, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import InsightRecommendation from './InsightRecommendation';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function WorkflowInsightsPanel({ workflowId, orgId, onApplyRecommendation }) {
  const [expanded, setExpanded] = useState(true);
  const queryClient = useQueryClient();

  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: ['workflow-insights', workflowId],
    queryFn: async () => {
      const response = await base44.functions.invoke('workflowAIInsights', {
        workflow_id: workflowId,
        org_id: orgId
      });
      return response.data;
    },
    enabled: !!workflowId && !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const refreshMutation = useMutation({
    mutationFn: () => refetch(),
    onSuccess: () => {
      toast.success('Insights refreshed');
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <p className="text-sm">Analyzing workflow performance...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  const { optimization_score, insights: recommendations = [], bottlenecks = [], redundancies = [] } = insights;

  const scoreColor = optimization_score >= 80 ? 'text-green-600' : 
                     optimization_score >= 60 ? 'text-yellow-600' : 'text-red-600';
  
  const scoreBackground = optimization_score >= 80 ? 'bg-green-100' : 
                          optimization_score >= 60 ? 'bg-yellow-100' : 'bg-red-100';

  const highPriorityInsights = recommendations.filter(r => r.severity === 'high');
  const mediumPriorityInsights = recommendations.filter(r => r.severity === 'medium');
  const lowPriorityInsights = recommendations.filter(r => r.severity === 'low');

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-purple-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Insights</CardTitle>
              <p className="text-xs text-slate-500">Powered by workflow analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("px-3 py-1.5 rounded-lg", scoreBackground)}>
              <p className={cn("text-2xl font-bold", scoreColor)}>{optimization_score}</p>
              <p className="text-xs text-slate-600">Score</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
            >
              <RefreshCw className={cn("h-4 w-4", refreshMutation.isPending && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {optimization_score < 100 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Optimization Potential</span>
              <span>{100 - optimization_score}% improvement possible</span>
            </div>
            <Progress value={optimization_score} className="h-2" />
          </div>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          {insights.execution_summary && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500">Executions</p>
                <p className="text-lg font-bold text-slate-700">{insights.execution_summary.total}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500">Success Rate</p>
                <p className="text-lg font-bold text-green-600">
                  {insights.execution_summary.success_rate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500">Failures</p>
                <p className="text-lg font-bold text-red-600">{insights.execution_summary.failed}</p>
              </div>
            </div>
          )}

          {/* Critical Issues */}
          {(bottlenecks.length > 0 || redundancies.length > 0) && (
            <div className="space-y-2">
              {bottlenecks.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900 mb-1">
                        {bottlenecks.length} Bottleneck{bottlenecks.length > 1 ? 's' : ''} Detected
                      </p>
                      {bottlenecks.slice(0, 2).map((bottleneck, idx) => (
                        <p key={idx} className="text-xs text-red-700">
                          • {bottleneck.issue} ({bottleneck.failure_rate?.toFixed(1)}% failure rate)
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {redundancies.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-900 mb-1">
                        {redundancies.length} Redundanc{redundancies.length > 1 ? 'ies' : 'y'} Found
                      </p>
                      {redundancies.slice(0, 2).map((redundancy, idx) => (
                        <p key={idx} className="text-xs text-yellow-700">
                          • {redundancy.reason}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Recommendations</h3>
                <Badge variant="secondary">{recommendations.length} insights</Badge>
              </div>

              {highPriorityInsights.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">High Priority</p>
                  {highPriorityInsights.map((insight, idx) => (
                    <InsightRecommendation
                      key={idx}
                      insight={insight}
                      onApply={onApplyRecommendation}
                    />
                  ))}
                </div>
              )}

              {mediumPriorityInsights.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">Medium Priority</p>
                  {mediumPriorityInsights.map((insight, idx) => (
                    <InsightRecommendation
                      key={idx}
                      insight={insight}
                      onApply={onApplyRecommendation}
                    />
                  ))}
                </div>
              )}

              {lowPriorityInsights.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Optimization Ideas</p>
                  {lowPriorityInsights.map((insight, idx) => (
                    <InsightRecommendation
                      key={idx}
                      insight={insight}
                      onApply={onApplyRecommendation}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium">Workflow is optimized!</p>
              <p className="text-xs">No improvements needed at this time.</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}