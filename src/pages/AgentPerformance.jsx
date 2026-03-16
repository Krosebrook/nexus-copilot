import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Zap, CheckCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { format, subDays } from 'date-fns';

function StatCard({ label, value, icon: Icon, sub, color = 'text-slate-700' }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AgentPerformance() {
  const [orgId, setOrgId] = useState(null);

  useEffect(() => {
    const init = async () => {
      const user = await base44.auth.me();
      const memberships = await base44.entities.Membership.filter({ user_email: user.email, status: 'active' });
      if (memberships.length > 0) setOrgId(memberships[0].org_id);
    };
    init();
  }, []);

  const { data: agents = [] } = useQuery({
    queryKey: ['agents', orgId],
    queryFn: () => base44.entities.Agent.filter({ org_id: orgId }),
    enabled: !!orgId,
  });

  const { data: executions = [] } = useQuery({
    queryKey: ['agent-executions', orgId],
    queryFn: () => base44.entities.AgentExecution.filter({ org_id: orgId }, '-created_date', 200),
    enabled: !!orgId,
    refetchInterval: 15000,
  });

  // Real-time subscription for new executions
  useEffect(() => {
    if (!orgId) return;
    const unsub = base44.entities.AgentExecution.subscribe(() => {
      // invalidate handled by refetchInterval; here we could do more granular updates if needed
    });
    return unsub;
  }, [orgId]);

  // Aggregate stats
  const total = executions.length;
  const completed = executions.filter(e => e.status === 'completed').length;
  const failed = executions.filter(e => e.status === 'failed').length;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const avgLatency = executions.length > 0
    ? Math.round(executions.reduce((s, e) => s + (e.execution_time_ms || 0), 0) / executions.length)
    : 0;

  // Per-agent stats
  const agentStats = agents.map(agent => {
    const agentExecs = executions.filter(e => e.agent_id === agent.id);
    const agentCompleted = agentExecs.filter(e => e.status === 'completed').length;
    const agentTotal = agentExecs.length;
    return {
      name: agent.name,
      total: agentTotal,
      success: agentCompleted,
      failed: agentExecs.filter(e => e.status === 'failed').length,
      rate: agentTotal > 0 ? Math.round((agentCompleted / agentTotal) * 100) : 0,
      avgMs: agentTotal > 0
        ? Math.round(agentExecs.reduce((s, e) => s + (e.execution_time_ms || 0), 0) / agentTotal)
        : 0,
    };
  });

  // Daily executions for the past 7 days
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayStr = format(day, 'MMM d');
    const dayExecs = executions.filter(e => {
      const d = new Date(e.created_date);
      return format(d, 'MMM d') === dayStr;
    });
    return {
      day: dayStr,
      total: dayExecs.length,
      completed: dayExecs.filter(e => e.status === 'completed').length,
      failed: dayExecs.filter(e => e.status === 'failed').length,
    };
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agent Performance</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time metrics across all agents in your organization.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Executions" value={total} icon={Bot} />
        <StatCard
          label="Success Rate"
          value={`${successRate}%`}
          icon={CheckCircle}
          color={successRate >= 80 ? 'text-green-600' : successRate >= 50 ? 'text-amber-600' : 'text-red-600'}
        />
        <StatCard label="Avg Latency" value={avgLatency > 0 ? `${avgLatency}ms` : '—'} icon={Zap} />
        <StatCard label="Failed" value={failed} icon={AlertTriangle} color={failed > 0 ? 'text-red-600' : 'text-slate-700'} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Executions — Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="completed" fill="#22c55e" name="Completed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Daily Total Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#64748b" strokeWidth={2} dot={{ r: 3 }} name="Total" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Per-agent breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">Per-Agent Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {agentStats.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No agents found for this organization.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {agentStats.map((a, i) => (
                <div key={i} className="py-3 flex items-center gap-4">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{a.name}</p>
                    <p className="text-xs text-slate-400">{a.total} executions · avg {a.avgMs || '—'}ms</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={a.rate >= 80 ? 'text-green-700 bg-green-50 border-green-200' : a.rate >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200'}
                    >
                      {a.rate}% success
                    </Badge>
                    {a.failed > 0 && (
                      <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200">
                        {a.failed} failed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent executions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No executions yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {executions.slice(0, 15).map((ex) => {
                const agent = agents.find(a => a.id === ex.agent_id);
                return (
                  <div key={ex.id} className="py-3 flex items-start gap-3">
                    <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                      ex.status === 'completed' ? 'bg-green-500' :
                      ex.status === 'failed' ? 'bg-red-500' :
                      ex.status === 'executing' ? 'bg-blue-500' : 'bg-slate-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{ex.task}</p>
                      <p className="text-xs text-slate-400">
                        {agent?.name || 'Unknown agent'} · {ex.execution_time_ms ? `${ex.execution_time_ms}ms` : '—'} · {format(new Date(ex.created_date), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${
                        ex.status === 'completed' ? 'text-green-700 bg-green-50 border-green-200' :
                        ex.status === 'failed' ? 'text-red-700 bg-red-50 border-red-200' :
                        'text-slate-600 bg-slate-50'
                      }`}
                    >
                      {ex.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}