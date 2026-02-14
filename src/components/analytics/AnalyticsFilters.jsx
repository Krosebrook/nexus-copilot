import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export default function AnalyticsFilters({
  dateRange,
  onDateRangeChange,
  selectedWorkflow,
  onWorkflowChange,
  selectedAgent,
  onAgentChange,
  selectedIntegration,
  onIntegrationChange,
  orgId
}) {
  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows', orgId],
    queryFn: () => base44.entities.Workflow.filter({ org_id: orgId }),
    enabled: !!orgId,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents', orgId],
    queryFn: () => base44.entities.Agent.filter({ org_id: orgId }),
    enabled: !!orgId,
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations', orgId],
    queryFn: () => base44.entities.Integration.filter({ org_id: orgId }),
    enabled: !!orgId,
  });

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-700">Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Date Range</label>
          <Select value={dateRange} onValueChange={onDateRangeChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Workflow</label>
          <Select value={selectedWorkflow} onValueChange={onWorkflowChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workflows</SelectItem>
              {workflows.map(w => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Agent</label>
          <Select value={selectedAgent} onValueChange={onAgentChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Integration</label>
          <Select value={selectedIntegration} onValueChange={onIntegrationChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Integrations</SelectItem>
              {integrations.map(i => (
                <SelectItem key={i.id} value={i.type}>{i.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}