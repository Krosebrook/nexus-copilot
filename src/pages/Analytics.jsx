import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart3, TrendingUp, Activity, Bot, Calendar, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import WorkflowAnalyticsPanel from '@/components/analytics/WorkflowAnalyticsPanel';
import AgentAnalyticsPanel from '@/components/analytics/AgentAnalyticsPanel';
import IntegrationAnalyticsPanel from '@/components/analytics/IntegrationAnalyticsPanel';
import AnalyticsFilters from '@/components/analytics/AnalyticsFilters';

export default function Analytics() {
  const [currentOrg, setCurrentOrg] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedWorkflow, setSelectedWorkflow] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedIntegration, setSelectedIntegration] = useState('all');

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const user = await base44.auth.me();
        const memberships = await base44.entities.Membership.filter({ 
          user_email: user.email, 
          status: 'active' 
        });
        if (memberships.length > 0) {
          const orgs = await base44.entities.Organization.filter({ id: memberships[0].org_id });
          if (orgs.length > 0) setCurrentOrg(orgs[0]);
        }
      } catch (e) {
        console.error('Failed to fetch org:', e);
      }
    };
    fetchOrg();
  }, []);

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', currentOrg?.id, dateRange, selectedWorkflow, selectedAgent, selectedIntegration],
    queryFn: () => base44.functions.invoke('workflowAgentAnalytics', {
      org_id: currentOrg.id,
      date_range: dateRange,
      workflow_id: selectedWorkflow !== 'all' ? selectedWorkflow : undefined,
      agent_id: selectedAgent !== 'all' ? selectedAgent : undefined,
      integration_type: selectedIntegration !== 'all' ? selectedIntegration : undefined,
    }),
    enabled: !!currentOrg,
  });

  const stats = analyticsData?.data || {};

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics</h1>
          <p className="text-slate-600">
            Monitor workflow performance and AI agent effectiveness
          </p>
        </div>

        {/* Filters */}
        <AnalyticsFilters
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          selectedWorkflow={selectedWorkflow}
          onWorkflowChange={setSelectedWorkflow}
          selectedAgent={selectedAgent}
          onAgentChange={setSelectedAgent}
          selectedIntegration={selectedIntegration}
          onIntegrationChange={setSelectedIntegration}
          orgId={currentOrg?.id}
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Workflow Executions</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {isLoading ? '...' : stats.total_workflow_executions || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Success Rate</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {isLoading ? '...' : `${Math.round(stats.workflow_success_rate || 0)}%`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Agent Executions</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {isLoading ? '...' : stats.total_agent_executions || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Avg Completion Time</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {isLoading ? '...' : `${Math.round(stats.avg_completion_time || 0)}s`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="workflows" className="space-y-4">
          <TabsList>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="agents">AI Agents</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows">
            <WorkflowAnalyticsPanel
              orgId={currentOrg?.id}
              dateRange={dateRange}
              selectedWorkflow={selectedWorkflow}
              analyticsData={stats}
            />
          </TabsContent>

          <TabsContent value="agents">
            <AgentAnalyticsPanel
              orgId={currentOrg?.id}
              dateRange={dateRange}
              selectedAgent={selectedAgent}
              analyticsData={stats}
            />
          </TabsContent>

          <TabsContent value="integrations">
            <IntegrationAnalyticsPanel
              orgId={currentOrg?.id}
              dateRange={dateRange}
              selectedIntegration={selectedIntegration}
              analyticsData={stats}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}