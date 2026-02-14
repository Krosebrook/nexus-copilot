import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Activity, Clock } from 'lucide-react';

export default function WorkflowAnalyticsPanel({ analyticsData, dateRange }) {
  if (!analyticsData) {
    return <div className="text-center py-8 text-slate-500">Loading analytics...</div>;
  }

  const { workflow_trend = [], workflow_breakdown = [] } = analyticsData;

  return (
    <div className="space-y-6">
      {/* Execution Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Workflow Execution Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={workflow_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Total Executions"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="successful" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Successful"
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Workflow Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Workflow Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workflow_breakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workflow_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="executions" fill="#8b5cf6" name="Executions" />
                  <Bar dataKey="success_rate" fill="#10b981" name="Success Rate %" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-3">
                {workflow_breakdown.map((workflow) => (
                  <div key={workflow.workflow_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-slate-700">{workflow.name}</p>
                      <p className="text-xs text-slate-500">
                        {workflow.executions} executions
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="text-slate-500">Success Rate</p>
                        <p className="font-semibold text-green-600">
                          {Math.round(workflow.success_rate)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500">Avg Time</p>
                        <p className="font-semibold text-slate-700">
                          {Math.round(workflow.avg_time)}s
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No workflow execution data for selected period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}