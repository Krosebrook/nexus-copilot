import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, AlertTriangle, GitCompare, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

export default function AdvancedAnalyticsPanel({ orgId, userEmail }) {
  const [activeAnalysis, setActiveAnalysis] = useState('user_trends');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['advanced-analytics', orgId, activeAnalysis, userEmail],
    queryFn: async () => {
      const response = await base44.functions.invoke('advancedAnalytics', {
        org_id: orgId,
        user_email: userEmail,
        analysis_type: activeAnalysis,
        time_range: '30d'
      });
      return response.data;
    },
    enabled: !!orgId
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeAnalysis} onValueChange={setActiveAnalysis}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="user_trends">
              <User className="h-4 w-4 mr-2" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="correlation_analysis">
              <GitCompare className="h-4 w-4 mr-2" />
              Correlations
            </TabsTrigger>
            <TabsTrigger value="anomaly_detection">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Anomalies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="user_trends" className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading trends...</p>
            ) : analyticsData ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Total Queries</p>
                    <p className="text-2xl font-semibold">{analyticsData.total_queries}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Agent Tasks</p>
                    <p className="text-2xl font-semibold">{analyticsData.total_agent_tasks}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Trend</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={analyticsData.trend === 'increasing' ? 'default' : 'secondary'}>
                        {analyticsData.trend}
                      </Badge>
                      <span className="text-sm font-medium">{analyticsData.change_percent}%</span>
                    </div>
                  </div>
                </div>

                {analyticsData.insights && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-900">Insights:</p>
                    <ul className="space-y-1">
                      {analyticsData.insights.map((insight, idx) => (
                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="correlation_analysis" className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-slate-500">Analyzing correlations...</p>
            ) : analyticsData?.correlations ? (
              <div className="space-y-4">
                {analyticsData.correlations.map((corr, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {corr.metric_1.replace(/_/g, ' ')} ↔ {corr.metric_2.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">{corr.insight}</p>
                        </div>
                        <Badge variant={
                          corr.strength === 'strong' ? 'default' :
                          corr.strength === 'moderate' ? 'secondary' : 'outline'
                        }>
                          {corr.strength}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-slate-600">Correlation:</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              Math.abs(corr.correlation) > 0.7 ? 'bg-green-600' :
                              Math.abs(corr.correlation) > 0.4 ? 'bg-yellow-600' : 'bg-slate-400'
                            }`}
                            style={{ width: `${Math.abs(corr.correlation) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{corr.correlation.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="anomaly_detection" className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-slate-500">Detecting anomalies...</p>
            ) : analyticsData?.anomalies ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Total Anomalies</p>
                    <p className="text-2xl font-semibold">{analyticsData.summary.total_anomalies}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-red-600 mb-1">Critical</p>
                    <p className="text-2xl font-semibold text-red-700">{analyticsData.summary.critical_anomalies}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-amber-600 mb-1">Warnings</p>
                    <p className="text-2xl font-semibold text-amber-700">{analyticsData.summary.warning_anomalies}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {analyticsData.anomalies.slice(0, 5).map((anomaly, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg border-l-4 ${
                        anomaly.severity === 'critical' ? 'bg-red-50 border-red-600' : 'bg-amber-50 border-amber-600'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {anomaly.metric.replace(/_/g, ' ')} - {anomaly.type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            {anomaly.date} • Value: {anomaly.value.toFixed(1)} • Z-score: {anomaly.z_score}
                          </p>
                        </div>
                        <Badge variant={anomaly.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {anomaly.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}