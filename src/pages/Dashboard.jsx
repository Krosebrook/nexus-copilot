import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Sparkles, MessageSquare, Users, Zap, ArrowRight,
  TrendingUp, Clock, Bookmark
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import StatsCard from '@/components/admin/StatsCard';
import ActivityFeed from '@/components/shared/ActivityFeed';
import PlanBadge from '@/components/shared/PlanBadge';
import ResponseCard from '@/components/copilot/ResponseCard';
import CustomizableDashboard from '@/components/dashboard/CustomizableDashboard';

export default function Dashboard() {
  const [currentOrg, setCurrentOrg] = useState(null);
  const [user, setUser] = useState(null);

  // Get current user and org
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
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

  // Fetch stats
  const { data: queries = [] } = useQuery({
    queryKey: ['dashboard-queries', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.Query.filter({ org_id: currentOrg.id }, '-created_date', 50) : [],
    enabled: !!currentOrg,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['dashboard-members', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.Membership.filter({ org_id: currentOrg.id, status: 'active' }) : [],
    enabled: !!currentOrg,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['dashboard-audit', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.AuditLog.filter({ org_id: currentOrg.id }, '-created_date', 20) : [],
    enabled: !!currentOrg,
  });

  // Calculate stats
  const thisWeekQueries = queries.filter(q => {
    const date = new Date(q.created_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  });

  const savedQueries = queries.filter(q => q.is_saved);

  const avgLatency = queries.length > 0 
    ? Math.round(queries.reduce((sum, q) => sum + (q.latency_ms || 0), 0) / queries.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-slate-900">
                Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
              </h1>
              {currentOrg && <PlanBadge plan={currentOrg.plan} />}
            </div>
            <p className="text-slate-500">
              Here's what's happening with your team
            </p>
          </div>
          <Link to={createPageUrl('Copilot')}>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Sparkles className="h-4 w-4 mr-2" />
              Open Copilot
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Queries"
            value={queries.length}
            change={12}
            changeLabel="vs last week"
            icon={MessageSquare}
          />
          <StatsCard
            title="This Week"
            value={thisWeekQueries.length}
            change={8}
            icon={TrendingUp}
          />
          <StatsCard
            title="Team Members"
            value={members.length}
            icon={Users}
          />
          <StatsCard
            title="Avg Response Time"
            value={`${avgLatency}ms`}
            change={-5}
            icon={Zap}
          />
        </div>

        {/* Customizable Widgets */}
        <div className="mb-8">
          <CustomizableDashboard orgId={currentOrg?.id} userEmail={user?.email} />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Queries */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent Queries</h2>
              <Link 
                to={createPageUrl('Copilot')}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            {queries.length === 0 ? (
              <Card className="p-8 text-center">
                <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">No queries yet</p>
                <Link to={createPageUrl('Copilot')}>
                  <Button>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Ask your first question
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {queries.slice(0, 3).map((query) => (
                  <ResponseCard key={query.id} query={query} compact />
                ))}
              </div>
            )}

            {/* Saved Queries */}
            {savedQueries.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Bookmark className="h-4 w-4 text-amber-500" />
                  <h2 className="text-lg font-semibold text-slate-900">Saved</h2>
                </div>
                <div className="space-y-3">
                  {savedQueries.slice(0, 2).map((query) => (
                    <ResponseCard key={query.id} query={query} compact />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed activities={auditLogs} compact />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}