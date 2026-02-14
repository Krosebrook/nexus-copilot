import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { FileText, Filter, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import PageHeader from '@/components/shell/PageHeader';
import DataToolbar from '@/components/shell/DataToolbar';
import ActivityTimeline from '@/components/shell/ActivityTimeline';

export default function ActivityLog() {
  const [currentOrg, setCurrentOrg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    category: 'all',
    status: 'all'
  });

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
        console.error(e);
      }
    };
    fetchOrg();
  }, []);

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', currentOrg?.id, selectedFilters],
    queryFn: async () => {
      if (!currentOrg) return [];
      
      const filters = { org_id: currentOrg.id };
      if (selectedFilters.category !== 'all') {
        filters.action_category = selectedFilters.category;
      }
      if (selectedFilters.status !== 'all') {
        filters.status = selectedFilters.status;
      }
      
      return base44.entities.AuditLog.filter(filters, '-created_date', 100);
    },
    enabled: !!currentOrg,
  });

  const filteredLogs = auditLogs.filter(log => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.action?.toLowerCase().includes(search) ||
      log.actor_email?.toLowerCase().includes(search) ||
      log.resource_type?.toLowerCase().includes(search)
    );
  });

  const handleExport = () => {
    const csv = [
      ['Date', 'Actor', 'Action', 'Category', 'Resource', 'Status'],
      ...filteredLogs.map(log => [
        log.created_date,
        log.actor_email,
        log.action,
        log.action_category,
        log.resource_type,
        log.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="Activity Log"
        description="Complete audit trail of all actions in your workspace"
        icon={FileText}
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      />

      <DataToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            key: 'category',
            label: 'Category',
            options: [
              { value: 'auth', label: 'Authentication' },
              { value: 'query', label: 'Queries' },
              { value: 'admin', label: 'Admin' },
              { value: 'data', label: 'Data' },
              { value: 'system', label: 'System' }
            ]
          },
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'success', label: 'Success' },
              { value: 'failure', label: 'Failure' }
            ]
          }
        ]}
        selectedFilters={selectedFilters}
        onFilterChange={(key, value) => setSelectedFilters({ ...selectedFilters, [key]: value })}
        resultCount={filteredLogs.length}
      />

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <ActivityTimeline events={filteredLogs} />
        </div>
      </div>
    </div>
  );
}