import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";

export default function PredictiveAnalyticsWidget({ orgId, metricType, title }) {
  const { data: predictions, isLoading } = useQuery({
    queryKey: ['predictive-analytics', orgId, metricType],
    queryFn: async () => {
      const response = await base44.functions.invoke('dashboardAnalytics', {
        org_id: orgId,
        analysis_type: 'predictive',
        metric_type: metricType
      });
      return response.data;
    },
    enabled: !!orgId,
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <Activity className="h-8 w-8 text-slate-400 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const trend = predictions?.trend || 'stable';
  const prediction = predictions?.next_period_prediction || 0;
  const confidence = predictions?.confidence_score || 0;
  const chartData = predictions?.historical_with_prediction || [];

  const getTrendIcon = () => {
    if (trend === 'improving' || trend === 'increasing') {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (trend === 'declining' || trend === 'decreasing') {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Activity className="h-4 w-4 text-slate-600" />;
  };

  const getTrendColor = () => {
    if (trend === 'improving' || trend === 'increasing') return 'text-green-600';
    if (trend === 'declining' || trend === 'decreasing') return 'text-red-600';
    return 'text-slate-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="outline" className="gap-1">
            {getTrendIcon()}
            {trend}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Prediction Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 mb-1">Next Period Forecast</p>
              <p className={`text-2xl font-semibold ${getTrendColor()}`}>
                {typeof prediction === 'number' ? prediction.toFixed(1) : prediction}
                {metricType.includes('rate') && '%'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 mb-1">Confidence</p>
              <p className="text-2xl font-semibold text-slate-900">
                {(confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Trend Chart */}
          {chartData.length > 0 && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 3 }}
                    name="Actual"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#f59e0b', r: 3 }}
                    name="Predicted"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Insights */}
          {predictions?.insights && predictions.insights.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-700">Key Insights:</p>
              <ul className="space-y-1">
                {predictions.insights.slice(0, 3).map((insight, idx) => (
                  <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}