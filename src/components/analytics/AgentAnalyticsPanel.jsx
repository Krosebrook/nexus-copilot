import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Bot, Star, TrendingUp } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function AgentAnalyticsPanel({ analyticsData }) {
  if (!analyticsData) {
    return <div className="text-center py-8 text-slate-500">Loading analytics...</div>;
  }

  const { agent_trend = [], agent_breakdown = [], avg_agent_rating } = analyticsData;

  return (
    <div className="space-y-6">
      {/* Agent Execution Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Agent Execution Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={agent_trend}>
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
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Total Executions"
                dot={{ fill: '#8b5cf6', r: 4 }}
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

      {/* Agent Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            Agent Performance
            <Badge variant="secondary" className="ml-auto">
              Avg Rating: {avg_agent_rating.toFixed(1)}/5
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agent_breakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agent_breakdown}>
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
                  <Bar dataKey="executions" fill="#3b82f6" name="Executions" />
                  <Bar dataKey="success_rate" fill="#10b981" name="Success Rate %" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-3">
                {agent_breakdown.map((agent) => (
                  <div key={agent.agent_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-slate-500" />
                        <p className="font-medium text-slate-700">{agent.name}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {agent.executions} executions • {agent.feedback_count} feedback
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="text-slate-500">Success Rate</p>
                        <p className="font-semibold text-green-600">
                          {Math.round(agent.success_rate)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500">User Rating</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <p className="font-semibold text-slate-700">
                            {agent.avg_rating > 0 ? agent.avg_rating.toFixed(1) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No agent execution data for selected period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}