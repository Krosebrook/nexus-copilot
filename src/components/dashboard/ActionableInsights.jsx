import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AlertTriangle, TrendingUp, ExternalLink, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ActionableInsights({ orgId, userEmail }) {
  const { data: analytics } = useQuery({
    queryKey: ['actionable-insights', orgId],
    queryFn: async () => {
      // Get both anomalies and correlations
      const [anomaliesRes, correlationsRes] = await Promise.all([
        base44.functions.invoke('advancedAnalytics', {
          org_id: orgId,
          analysis_type: 'anomaly_detection',
          time_range: '30d'
        }),
        base44.functions.invoke('advancedAnalytics', {
          org_id: orgId,
          analysis_type: 'correlation_analysis',
          time_range: '30d'
        })
      ]);
      return {
        anomalies: anomaliesRes.data?.anomalies || [],
        correlations: correlationsRes.data?.correlations || []
      };
    },
    enabled: !!orgId,
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  const generateRecommendations = () => {
    const recommendations = [];

    // Anomaly-based recommendations
    analytics?.anomalies?.forEach(anomaly => {
      if (anomaly.severity === 'critical') {
        if (anomaly.metric === 'workflow_success_rate' && anomaly.type === 'unusually_low') {
          recommendations.push({
            type: 'alert',
            severity: 'critical',
            title: 'Workflow Success Rate Drop Detected',
            description: `Success rate dropped to ${anomaly.value.toFixed(1)}% on ${anomaly.date}`,
            action: 'Review Failed Workflows',
            link: createPageUrl('WorkflowBuilder')
          });
        } else if (anomaly.metric === 'query_volume' && anomaly.type === 'drop') {
          recommendations.push({
            type: 'alert',
            severity: 'warning',
            title: 'Low Copilot Engagement',
            description: `Query volume dropped significantly on ${anomaly.date}`,
            action: 'Check Copilot Status',
            link: createPageUrl('Copilot')
          });
        }
      }
    });

    // Correlation-based recommendations
    analytics?.correlations?.forEach(corr => {
      if (corr.correlation > 0.6) {
        if (corr.metric_1 === 'knowledge_base_usage' && corr.metric_2 === 'workflow_success_rate') {
          recommendations.push({
            type: 'insight',
            severity: 'info',
            title: 'Boost Workflows with Knowledge Base',
            description: 'Strong correlation detected: Higher KB usage leads to better workflow success',
            action: 'Expand Knowledge Base',
            link: createPageUrl('Knowledge')
          });
        } else if (corr.metric_1 === 'copilot_query_volume' && corr.metric_2 === 'workflow_executions') {
          recommendations.push({
            type: 'insight',
            severity: 'info',
            title: 'Copilot Drives Automation',
            description: 'Teams using Copilot more frequently create more automated workflows',
            action: 'View Workflows',
            link: createPageUrl('WorkflowBuilder')
          });
        }
      }
    });

    return recommendations;
  };

  const recommendations = generateRecommendations();

  if (recommendations.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-medium text-green-900">All Systems Optimal</p>
            <p className="text-sm text-green-700">No anomalies or recommendations at this time</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {recommendations.some(r => r.type === 'alert') && (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          )}
          Actionable Insights
          <Badge variant="secondary" className="ml-auto">
            {recommendations.length} {recommendations.length === 1 ? 'item' : 'items'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg border-l-4 ${
              rec.severity === 'critical' ? 'bg-red-50 border-red-600' :
              rec.severity === 'warning' ? 'bg-amber-50 border-amber-600' :
              'bg-blue-50 border-blue-600'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {rec.type === 'alert' ? (
                    <AlertTriangle className={`h-4 w-4 ${
                      rec.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                    }`} />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  )}
                  <p className="font-medium text-slate-900">{rec.title}</p>
                </div>
                <p className="text-sm text-slate-600 mb-3">{rec.description}</p>
                <Link to={rec.link}>
                  <Button 
                    size="sm" 
                    variant={rec.type === 'alert' ? 'default' : 'outline'}
                    className="gap-2"
                  >
                    {rec.action}
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <Badge variant={
                rec.severity === 'critical' ? 'destructive' :
                rec.severity === 'warning' ? 'secondary' : 'outline'
              }>
                {rec.severity}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}