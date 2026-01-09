import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plug, AlertCircle, CheckCircle, Clock, RefreshCw, 
  Settings, Trash2, AlertTriangle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import IntegrationHealthCard from '@/components/integrations/IntegrationHealthCard';

export default function IntegrationHealth() {
  const [currentOrg, setCurrentOrg] = useState(null);
  const queryClient = useQueryClient();

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

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['integrations', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.Integration.filter({ org_id: currentOrg.id }, '-updated_date') : [],
    enabled: !!currentOrg,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['integration-logs', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.AuditLog.filter({ 
      org_id: currentOrg.id, 
      action_category: 'integration' 
    }, '-created_date', 20) : [],
    enabled: !!currentOrg,
  });

  const syncMutation = useMutation({
    mutationFn: async (integration) => {
      await base44.entities.Integration.update(integration.id, {
        last_sync_at: new Date().toISOString(),
        sync_count: (integration.sync_count || 0) + 1,
      });
      const user = await base44.auth.me();
      await base44.entities.AuditLog.create({
        org_id: currentOrg.id,
        actor_email: user.email,
        action: 'integration_sync',
        action_category: 'integration',
        resource_type: 'Integration',
        resource_id: integration.id,
        status: 'success',
        details: { integration_type: integration.type },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['integration-logs'] });
      toast.success('Integration synced');
    },
    onError: () => toast.error('Sync failed'),
  });

  const reconnectMutation = useMutation({
    mutationFn: async (integration) => {
      await base44.entities.Integration.update(integration.id, {
        status: 'pending_auth',
        error_message: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Reconnection initiated - please complete authentication');
    },
    onError: () => toast.error('Failed to initiate reconnection'),
  });

  const removeMutation = useMutation({
    mutationFn: async (integration) => {
      await base44.entities.Integration.delete(integration.id);
      const user = await base44.auth.me();
      await base44.entities.AuditLog.create({
        org_id: currentOrg.id,
        actor_email: user.email,
        action: 'integration_removed',
        action_category: 'integration',
        resource_type: 'Integration',
        resource_id: integration.id,
        status: 'success',
        details: { integration_type: integration.type, integration_name: integration.name },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['integration-logs'] });
      toast.success('Integration removed');
    },
    onError: () => toast.error('Failed to remove integration'),
  });

  const statusCounts = {
    active: integrations.filter(i => i.status === 'active').length,
    error: integrations.filter(i => i.status === 'error').length,
    pending_auth: integrations.filter(i => i.status === 'pending_auth').length,
    inactive: integrations.filter(i => i.status === 'inactive').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Plug className="h-6 w-6 text-slate-400 animate-pulse" />
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Plug className="h-6 w-6 text-slate-700" />
            <h1 className="text-2xl font-semibold text-slate-900">Integration Health</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['integrations'] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Active</p>
                  <p className="text-2xl font-semibold text-green-600">{statusCounts.active}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Errors</p>
                  <p className="text-2xl font-semibold text-red-600">{statusCounts.error}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pending Auth</p>
                  <p className="text-2xl font-semibold text-amber-600">{statusCounts.pending_auth}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Inactive</p>
                  <p className="text-2xl font-semibold text-slate-600">{statusCounts.inactive}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration List */}
        {integrations.length === 0 ? (
          <Card className="p-12 text-center">
            <Plug className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No integrations connected</h3>
            <p className="text-slate-500 mb-4">Connect your first integration to get started</p>
            <Button>Add Integration</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {integrations.map((integration) => (
              <IntegrationHealthCard
                key={integration.id}
                integration={integration}
                onSync={() => syncMutation.mutate(integration)}
                onReconnect={() => reconnectMutation.mutate(integration)}
                onRemove={() => removeMutation.mutate(integration)}
                isSyncing={syncMutation.isPending}
              />
            ))}
          </div>
        )}

        {/* Recent Activity */}
        {auditLogs.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className={cn(
                      "h-2 w-2 rounded-full mt-1.5",
                      log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                    )} />
                    <div className="flex-1">
                      <p className="text-slate-900">
                        <span className="font-medium">{log.actor_email}</span>
                        {' '}{log.action.replace('_', ' ')}
                        {log.details?.integration_type && (
                          <span className="text-slate-500"> ({log.details.integration_type})</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(log.created_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}