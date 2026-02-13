import React from 'react';
import AIInsightsWidget from './AIInsightsWidget';
import ActivityFeed from '@/components/shared/ActivityFeed';
import CustomizableDashboard from './CustomizableDashboard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from '@/components/admin/StatsCard';
import { Users, MessageSquare, Zap, TrendingUp } from 'lucide-react';

export default function RoleBasedDashboard({ role, orgId, userEmail, queries = [], members = [] }) {
  // Admin dashboard - Full analytics and management
  if (role === 'admin' || role === 'owner') {
    return (
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Queries"
            value={queries.length}
            icon={MessageSquare}
            trend="+12%"
            trendUp
          />
          <StatsCard
            title="Team Members"
            value={members.length}
            icon={Users}
            trend="+2 this week"
            trendUp
          />
          <StatsCard
            title="Avg Response Time"
            value={`${Math.round(queries.reduce((acc, q) => acc + (q.latency_ms || 0), 0) / queries.length || 0)}ms`}
            icon={Zap}
            trend="-15%"
            trendUp
          />
          <StatsCard
            title="Success Rate"
            value="98.5%"
            icon={TrendingUp}
            trend="+2.1%"
            trendUp
          />
        </div>

        {/* AI Insights */}
        <AIInsightsWidget orgId={orgId} />

        {/* Customizable Analytics */}
        <CustomizableDashboard orgId={orgId} userEmail={userEmail} />
      </div>
    );
  }

  // Editor dashboard - Content focused
  if (role === 'editor') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatsCard
            title="My Queries"
            value={queries.filter(q => q.created_by === userEmail).length}
            icon={MessageSquare}
          />
          <StatsCard
            title="Saved Items"
            value={queries.filter(q => q.is_saved).length}
            icon={TrendingUp}
          />
        </div>

        <AIInsightsWidget orgId={orgId} />

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-700">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={[]} compact />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Viewer dashboard - Read-only, simplified
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard
          title="Queries This Week"
          value={queries.filter(q => q.created_by === userEmail).length}
          icon={MessageSquare}
        />
        <StatsCard
          title="Avg Response Time"
          value={`${Math.round(queries.filter(q => q.created_by === userEmail).reduce((acc, q) => acc + (q.latency_ms || 0), 0) / queries.filter(q => q.created_by === userEmail).length || 0)}ms`}
          icon={Zap}
        />
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-700">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed activities={[]} compact />
        </CardContent>
      </Card>
    </div>
  );
}