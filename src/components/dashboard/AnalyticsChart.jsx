import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsChart({ 
  orgId, 
  userEmail, 
  analyticsType, 
  timeRange = '7d',
  chartType = 'line',
  title 
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await base44.functions.invoke('dashboardAnalytics', {
          org_id: orgId,
          user_email: userEmail,
          time_range: timeRange,
          analytics_type: analyticsType
        });
        setData(response.data);
      } catch (error) {
        console.error('Analytics fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orgId && analyticsType) {
      fetchAnalytics();
    }
  }, [orgId, userEmail, analyticsType, timeRange]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!orgId) return;

    const unsubscribe = base44.entities.WorkflowExecution.subscribe((event) => {
      if (event.data?.org_id === orgId && analyticsType === 'workflow_analytics') {
        // Trigger refresh
        setTimeout(async () => {
          const response = await base44.functions.invoke('dashboardAnalytics', {
            org_id: orgId,
            analytics_type: analyticsType,
            time_range: timeRange
          });
          setData(response.data);
        }, 500);
      }
    });

    return unsubscribe;
  }, [orgId, analyticsType, timeRange]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  const renderPrediction = () => {
    if (!data?.prediction) return null;
    
    const { trend, confidence, predicted_next_week } = data.prediction;
    const trendIcons = {
      improving: <TrendingUp className="h-4 w-4 text-green-600" />,
      declining: <TrendingDown className="h-4 w-4 text-red-600" />,
      stable: <Minus className="h-4 w-4 text-slate-600" />
    };

    return (
      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <p className="text-xs font-medium text-slate-700 mb-2">Prediction</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {trendIcons[trend]}
            <span className="text-sm capitalize">{trend}</span>
          </div>
          {predicted_next_week !== undefined && (
            <Badge variant="outline">
              Next week: {predicted_next_week.toFixed(0)}%
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Confidence: {confidence?.toFixed(0)}%
        </p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {analyticsType === 'workflow_analytics' && data && (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{data.success_count}</p>
                <p className="text-xs text-green-600">Successful</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-700">{data.fail_count}</p>
                <p className="text-xs text-red-600">Failed</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{data.success_rate?.toFixed(0)}%</p>
                <p className="text-xs text-blue-600">Success Rate</p>
              </div>
            </div>
            {renderPrediction()}
          </div>
        )}

        {analyticsType === 'copilot_analytics' && data && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Total Queries</p>
                <p className="text-2xl font-bold">{data.total_queries}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Avg Latency</p>
                <p className="text-2xl font-bold">{(data.avg_latency_ms || 0).toFixed(0)}ms</p>
              </div>
            </div>
            {data.type_breakdown && (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={Object.entries(data.type_breakdown).map(([name, value]) => ({ name, value }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label
                  >
                    {Object.keys(data.type_breakdown).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {analyticsType === 'knowledge_analytics' && data && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Total Articles</p>
                <p className="text-2xl font-bold">{data.total_articles}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Total Usage</p>
                <p className="text-2xl font-bold">{data.total_usage}</p>
              </div>
            </div>
            {data.top_articles?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-700">Top Articles</p>
                {data.top_articles.map((article, idx) => (
                  <div key={article.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 truncate">{article.title}</span>
                    <Badge variant="outline">{article.usage_count || 0}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {analyticsType === 'user_activity' && data && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Total Queries</p>
                <p className="text-2xl font-bold">{data.total_queries}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Agent Tasks</p>
                <p className="text-2xl font-bold">{data.agent_tasks}</p>
              </div>
            </div>
            {data.activity_by_day && (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={Object.entries(data.activity_by_day).map(([date, count]) => ({ date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }), count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {analyticsType === 'agent_performance' && data && (
          <div className="space-y-2">
            {data.agents?.map((agent) => (
              <div key={agent.agent_id} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{agent.name}</p>
                  <Badge variant={agent.success_rate > 80 ? 'default' : 'destructive'}>
                    {agent.success_rate.toFixed(0)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{agent.executions} executions</span>
                  <span>★ {agent.avg_satisfaction.toFixed(1)}/5</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}