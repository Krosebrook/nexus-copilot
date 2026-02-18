import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  MessageSquare, Users, Zap, ArrowRight,
  TrendingUp, Clock, Bookmark
} from 'lucide-react';
import AIGlyph from '@/components/shared/AIGlyph';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import StatsCard from '@/components/admin/StatsCard';
import ActivityFeed from '@/components/shared/ActivityFeed';
import PlanBadge from '@/components/shared/PlanBadge';
import ResponseCard from '@/components/copilot/ResponseCard';
import UnifiedAnalytics from '@/components/dashboard/UnifiedAnalytics';
import AlertHero from '@/components/dashboard/AlertHero';
import RoleBasedDashboard from '@/components/dashboard/RoleBasedDashboard';
import GettingStartedChecklist from '@/components/onboarding/GettingStartedChecklist';
import FeatureTour from '@/components/onboarding/FeatureTour';
import { toast } from "sonner";

export default function Dashboard() {
  const [currentOrg, setCurrentOrg] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showTour, setShowTour] = useState(false);

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
          if (orgs.length > 0) {
            setCurrentOrg(orgs[0]);
            setUserRole(memberships[0].role);
            
            // Show tour for new users
            const tourCompleted = localStorage.getItem('feature_tour_completed');
            if (!tourCompleted) {
              setTimeout(() => setShowTour(true), 1000);
            }
          }
        } else {
          // No organization - redirect to onboarding
          window.location.href = createPageUrl('Onboarding');
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to load workspace', {
          description: 'Please try refreshing the page'
        });
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-700">
                Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
              </h1>
              {currentOrg && <PlanBadge plan={currentOrg.plan} />}
            </div>
            <p className="text-slate-500">
              Here's what's happening with your team
            </p>
          </div>
          <Link to={createPageUrl('Copilot')} className="w-full sm:w-auto">
            <Button className="bg-slate-900 hover:bg-slate-800 shadow-sm gap-2 w-full sm:w-auto">
              <AIGlyph size="sm" className="text-white" />
              Open Copilot
              <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
                ⌘/
              </kbd>
            </Button>
          </Link>
        </div>

        {/* Getting Started Checklist */}
        {currentOrg && user && (
          <div className="mb-8 sm:mb-12">
            <GettingStartedChecklist orgId={currentOrg.id} userEmail={user.email} />
          </div>
        )}

        {/* Alert Hero */}
        <div className="mb-8 sm:mb-12">
          <AlertHero orgId={currentOrg?.id} />
        </div>

        {/* Role-Based Dashboard */}
        <RoleBasedDashboard 
          role={userRole} 
          orgId={currentOrg?.id} 
          userEmail={user?.email}
          queries={queries}
          members={members}
        />
      </div>

      {/* Feature Tour */}
      {showTour && <FeatureTour onComplete={() => setShowTour(false)} />}
    </div>
  );
}