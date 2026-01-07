import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Activity, Server, Database, Zap, Clock, 
  CheckCircle, AlertTriangle, RefreshCw, Shield
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import SystemHealthCard from '@/components/admin/SystemHealthCard';
import AuditLogTable from '@/components/admin/AuditLogTable';

export default function SystemHealth() {
  const [currentOrg, setCurrentOrg] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Get current user and org
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await base44.auth.me();
        const memberships = await base44.entities.Membership.filter({ 
          user_email: userData.email, 
          status: 'active' 
        });
        if (memberships.length > 0) {
          const orgs = await base44.entities.Organization.filter({ id: memberships[0].org_id });
          if (orgs.length > 0) setCurrentOrg(orgs[0]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  // Fetch jobs
  const { data: jobs = [], refetch: refetchJobs } = useQuery({
    queryKey: ['jobs', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.BackgroundJob.filter({ org_id: currentOrg.id }, '-created_date', 20) : [],
    enabled: !!currentOrg,
    refetchInterval: 30000,
  });

  // Fetch recent errors
  const { data: errorLogs = [] } = useQuery({
    queryKey: ['error-logs', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.AuditLog.filter({ 
      org_id: currentOrg.id, 
      status: 'failure' 
    }, '-created_date', 10) : [],
    enabled: !!currentOrg,
  });

  // Fetch all recent audit logs
  const { data: recentLogs = [] } = useQuery({
    queryKey: ['recent-logs', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.AuditLog.filter({ 
      org_id: currentOrg.id 
    }, '-created_date', 20) : [],
    enabled: !!currentOrg,
  });

  // Calculate stats
  const runningJobs = jobs.filter(j => j.status === 'running').length;
  const queuedJobs = jobs.filter(j => j.status === 'queued').length;
  const failedJobs = jobs.filter(j => j.status === 'failed' || j.status === 'dead_letter').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;

  const overallHealth = failedJobs > 2 ? 'degraded' : errorLogs.length > 5 ? 'degraded' : 'healthy';

  const handleRefresh = () => {
    refetchJobs();
    setLastRefresh(new Date());
  };

  const JOB_STATUS_COLORS = {
    queued: 'bg-slate-100 text-slate-700',
    running: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    dead_letter: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Activity className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">System Health</h1>
              <p className="text-sm text-slate-500">Monitor platform status and performance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Last updated: {format(lastRefresh, 'h:mm:ss a')}
            </span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  overallHealth === 'healthy' ? 'bg-green-100' : 'bg-amber-100'
                }`}>
                  {overallHealth === 'healthy' ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {overallHealth === 'healthy' ? 'All Systems Operational' : 'Degraded Performance'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {overallHealth === 'healthy' 
                      ? 'All services are running normally' 
                      : 'Some services may be experiencing issues'}
                  </p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={overallHealth === 'healthy' 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'}
              >
                {overallHealth === 'healthy' ? 'Healthy' : 'Degraded'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Service Health Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SystemHealthCard
            service="AI Engine"
            status="healthy"
            latency={245}
            uptime={99.9}
            icon={Zap}
          />
          <SystemHealthCard
            service="Database"
            status="healthy"
            latency={12}
            uptime={99.99}
            icon={Database}
          />
          <SystemHealthCard
            service="API Gateway"
            status="healthy"
            latency={45}
            uptime={99.95}
            icon={Server}
          />
          <SystemHealthCard
            service="Auth Service"
            status="healthy"
            latency={28}
            uptime={100}
            icon={Shield}
          />
        </div>

        {/* Job Queue & Recent Errors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Job Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                Job Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Job Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-semibold text-slate-900">{queuedJobs}</p>
                  <p className="text-xs text-slate-500">Queued</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-semibold text-blue-700">{runningJobs}</p>
                  <p className="text-xs text-blue-600">Running</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-2xl font-semibold text-green-700">{completedJobs}</p>
                  <p className="text-xs text-green-600">Completed</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-xl">
                  <p className="text-2xl font-semibold text-red-700">{failedJobs}</p>
                  <p className="text-xs text-red-600">Failed</p>
                </div>
              </div>

              {/* Recent Jobs */}
              <div className="space-y-2 max-h-64 overflow-auto">
                {jobs.length === 0 ? (
                  <div className="text-center py-6">
                    <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No recent jobs</p>
                  </div>
                ) : (
                  jobs.slice(0, 8).map((job) => (
                    <div 
                      key={job.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={JOB_STATUS_COLORS[job.status]}>
                          {job.status}
                        </Badge>
                        <span className="text-sm font-medium text-slate-700">
                          {job.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          {format(new Date(job.created_date), 'h:mm a')}
                        </p>
                        {job.retry_count > 0 && (
                          <p className="text-xs text-amber-600">
                            Retry {job.retry_count}/{job.max_retries}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Errors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Recent Errors
                {errorLogs.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {errorLogs.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {errorLogs.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-10 w-10 text-green-300 mx-auto mb-3" />
                  <p className="text-slate-500">No recent errors</p>
                  <p className="text-sm text-slate-400 mt-1">Everything is running smoothly</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-auto">
                  {errorLogs.map((log) => (
                    <div 
                      key={log.id}
                      className="p-3 bg-red-50 border border-red-100 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-800">
                            {log.action}
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            {log.actor_email}
                          </p>
                        </div>
                        <span className="text-xs text-red-500">
                          {format(new Date(log.created_date), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      {log.details?.error && (
                        <p className="text-xs text-red-700 mt-2 font-mono bg-red-100 p-2 rounded">
                          {log.details.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Audit Trail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AuditLogTable logs={recentLogs} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}