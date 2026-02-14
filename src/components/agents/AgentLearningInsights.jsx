import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Brain, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function AgentLearningInsights({ agentId, orgId }) {
  const { data: patterns = [], isLoading } = useQuery({
    queryKey: ['agent-learning', agentId],
    queryFn: () => base44.entities.AgentLearning.filter({ 
      agent_id: agentId,
      org_id: orgId 
    }, '-confidence_score'),
    enabled: !!agentId && !!orgId,
  });

  const preferPatterns = patterns.filter(p => p.pattern_type === 'prefer');
  const avoidPatterns = patterns.filter(p => p.pattern_type === 'avoid');

  const highConfidenceCount = patterns.filter(p => p.confidence_score >= 0.7).length;
  const totalFeedback = patterns.reduce((sum, p) => sum + (p.feedback_count || 1), 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-4 bg-slate-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (patterns.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-slate-500">
          <Brain className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No learning patterns yet</p>
          <p className="text-xs">Agent will learn from user feedback</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base">Learning Insights</CardTitle>
          </div>
          <Badge variant="secondary">
            {patterns.length} patterns
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{preferPatterns.length}</p>
            <p className="text-xs text-slate-600">Prefer</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{avoidPatterns.length}</p>
            <p className="text-xs text-slate-600">Avoid</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{highConfidenceCount}</p>
            <p className="text-xs text-slate-600">High Conf.</p>
          </div>
        </div>

        {/* Prefer Patterns */}
        {preferPatterns.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-semibold text-slate-700">Preferred Approaches</h3>
            </div>
            <div className="space-y-2">
              {preferPatterns.slice(0, 3).map((pattern) => (
                <div key={pattern.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-slate-900">
                      {pattern.corrected_action || pattern.original_action}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(pattern.confidence_score * 100)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-1">{pattern.reasoning}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <TrendingUp className="h-3 w-3" />
                    {pattern.feedback_count} validation{pattern.feedback_count > 1 ? 's' : ''}
                  </div>
                  {pattern.applicable_conditions && pattern.applicable_conditions.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      When: {pattern.applicable_conditions.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avoid Patterns */}
        {avoidPatterns.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <h3 className="text-sm font-semibold text-slate-700">Patterns to Avoid</h3>
            </div>
            <div className="space-y-2">
              {avoidPatterns.slice(0, 3).map((pattern) => (
                <div key={pattern.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-slate-900">
                      {pattern.original_action}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(pattern.confidence_score * 100)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-1">{pattern.reasoning}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <TrendingUp className="h-3 w-3" />
                    {pattern.feedback_count} correction{pattern.feedback_count > 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}