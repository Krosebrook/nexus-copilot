import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AIGlyph from '@/components/shared/AIGlyph';

export default function AIInsightsWidget({ orgId }) {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['ai-insights', orgId],
    queryFn: async () => {
      // Fetch recent queries and activity
      const queries = await base44.entities.Query.filter({ org_id: orgId }, '-created_date', 50);
      const auditLogs = await base44.entities.AuditLog.filter({ org_id: orgId }, '-created_date', 100);
      
      // Generate AI insights
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this workspace activity and provide 3-4 key insights as a JSON array. Each insight should have: type (trend/alert/success), title (very short), description (one sentence), and priority (high/medium/low).

Recent queries: ${queries.slice(0, 10).map(q => q.prompt).join(', ')}
Activity count: ${auditLogs.length} actions in recent period
Query patterns: ${queries.map(q => q.response_type).join(', ')}

Return only the JSON array, no other text.`,
        response_json_schema: {
          type: 'object',
          properties: {
            insights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string' }
                }
              }
            }
          }
        }
      });

      return response?.insights || [];
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getIcon = (type) => {
    switch (type) {
      case 'trend': return TrendingUp;
      case 'alert': return AlertCircle;
      case 'success': return CheckCircle;
      default: return Sparkles;
    }
  };

  const getColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-700">
            <AIGlyph size="sm" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-700">
          <AIGlyph size="sm" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, idx) => {
            const Icon = getIcon(insight.type);
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg transition-all duration-200 hover:shadow-sm ${getColor(insight.priority)}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{insight.title}</p>
                      {insight.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0">High</Badge>
                      )}
                    </div>
                    <p className="text-xs opacity-90">{insight.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}