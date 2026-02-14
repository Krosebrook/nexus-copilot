import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Plug } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export default function IntegrationAnalyticsPanel({ analyticsData }) {
  if (!analyticsData) {
    return <div className="text-center py-8 text-slate-500">Loading analytics...</div>;
  }

  const { integration_usage = [] } = analyticsData;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plug className="h-5 w-5 text-blue-600" />
            Integration Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {integration_usage.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={integration_usage}
                    dataKey="usage_count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {integration_usage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-2">
                {integration_usage
                  .sort((a, b) => b.usage_count - a.usage_count)
                  .map((integration, idx) => (
                    <div key={integration.integration_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium text-slate-700">{integration.name}</p>
                          <p className="text-xs text-slate-500">{integration.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-700">{integration.usage_count}</p>
                        <p className="text-xs text-slate-500">uses</p>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No integration usage data for selected period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}