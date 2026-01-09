import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Webhook, Clock, Zap, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

import PermissionGuard from '@/components/rbac/PermissionGuard';

const EVENT_TYPES = [
  'new_message', 'page_updated', 'issue_created', 'issue_updated',
  'pull_request', 'commit_pushed', 'ticket_created', 'status_changed'
];

export default function IntegrationConfig() {
  const [currentOrg, setCurrentOrg] = useState(null);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
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

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.Integration.filter({ org_id: currentOrg.id }) : [],
    enabled: !!currentOrg,
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ integrationId, config }) => {
      await base44.entities.Integration.update(integrationId, { config });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Configuration updated');
    },
  });

  const bulkResyncMutation = useMutation({
    mutationFn: async (integrationIds) => {
      const updates = integrationIds.map(id => 
        base44.entities.Integration.update(id, {
          last_sync_at: new Date().toISOString(),
          sync_count: (integrations.find(i => i.id === id)?.sync_count || 0) + 1,
        })
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Bulk sync completed');
    },
  });

  const [webhookUrl, setWebhookUrl] = useState('');
  const [syncInterval, setSyncInterval] = useState('60');
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [bulkSelected, setBulkSelected] = useState([]);

  useEffect(() => {
    if (selectedIntegration) {
      setWebhookUrl(selectedIntegration.config?.webhook_url || '');
      setSyncInterval(selectedIntegration.config?.sync_interval_minutes?.toString() || '60');
      setSelectedEvents(selectedIntegration.config?.event_triggers || []);
    }
  }, [selectedIntegration]);

  const handleSaveConfig = () => {
    if (!selectedIntegration) return;
    
    updateConfigMutation.mutate({
      integrationId: selectedIntegration.id,
      config: {
        ...selectedIntegration.config,
        webhook_url: webhookUrl,
        sync_interval_minutes: parseInt(syncInterval),
        event_triggers: selectedEvents,
      },
    });
  };

  return (
    <PermissionGuard permission="manage_integrations" fallback={
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-slate-500">You don't have permission to manage integrations</p>
        </Card>
      </div>
    }>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-slate-900">Integration Configuration</h1>
            {bulkSelected.length > 0 && (
              <Button
                onClick={() => bulkResyncMutation.mutate(bulkSelected)}
                disabled={bulkResyncMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${bulkResyncMutation.isPending ? 'animate-spin' : ''}`} />
                Bulk Resync ({bulkSelected.length})
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Integration List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {integrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedIntegration(integration)}
                    >
                      <Checkbox
                        checked={bulkSelected.includes(integration.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBulkSelected([...bulkSelected, integration.id]);
                          } else {
                            setBulkSelected(bulkSelected.filter(id => id !== integration.id));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{integration.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{integration.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Configuration Panel */}
            <div className="lg:col-span-2 space-y-6">
              {selectedIntegration ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Webhook className="h-5 w-5" />
                        Webhook Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Webhook URL</Label>
                        <Input
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder="https://your-endpoint.com/webhook"
                        />
                      </div>

                      <div>
                        <Label className="mb-3 block">Event Triggers</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {EVENT_TYPES.map((event) => (
                            <div key={event} className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedEvents.includes(event)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedEvents([...selectedEvents, event]);
                                  } else {
                                    setSelectedEvents(selectedEvents.filter(e => e !== event));
                                  }
                                }}
                              />
                              <label className="text-sm">{event.replace('_', ' ')}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Sync Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Sync Interval (minutes)</Label>
                        <Select value={syncInterval} onValueChange={setSyncInterval}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">Every 15 minutes</SelectItem>
                            <SelectItem value="30">Every 30 minutes</SelectItem>
                            <SelectItem value="60">Every hour</SelectItem>
                            <SelectItem value="180">Every 3 hours</SelectItem>
                            <SelectItem value="360">Every 6 hours</SelectItem>
                            <SelectItem value="720">Every 12 hours</SelectItem>
                            <SelectItem value="1440">Daily</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={handleSaveConfig} className="w-full">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Save Configuration
                      </Button>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="p-12 text-center">
                  <Zap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Select an integration to configure</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}