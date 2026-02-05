import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Plus, Mail, Webhook, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const METRICS = [
  { value: 'query_success_rate', label: 'Query Success Rate (%)', unit: '%' },
  { value: 'agent_performance', label: 'Agent Performance (%)', unit: '%' },
  { value: 'workflow_failures', label: 'Workflow Failures (count)', unit: '' },
  { value: 'avg_response_time', label: 'Avg Response Time (ms)', unit: 'ms' },
  { value: 'user_satisfaction', label: 'User Satisfaction (1-5)', unit: '' }
];

const OPERATORS = [
  { value: 'less_than', label: 'Less than', icon: TrendingDown },
  { value: 'greater_than', label: 'Greater than', icon: TrendingUp },
  { value: 'equals', label: 'Equals' },
  { value: 'less_or_equal', label: 'Less than or equal' },
  { value: 'greater_or_equal', label: 'Greater than or equal' }
];

const TIME_WINDOWS = [
  { value: '5m', label: '5 minutes' },
  { value: '15m', label: '15 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' }
];

export default function DashboardAlertConfig({ orgId }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    metric: 'query_success_rate',
    operator: 'less_than',
    value: '',
    time_window: '1h',
    entity_type: '',
    entity_id: '',
    cooldown_minutes: 60,
    channels: [
      { type: 'in_app', config: {} }
    ]
  });

  const queryClient = useQueryClient();

  const createAlertMutation = useMutation({
    mutationFn: async (alertData) => {
      await base44.entities.DashboardAlert.create({
        org_id: orgId,
        status: 'active',
        ...alertData,
        condition: {
          operator: alertData.operator,
          value: parseFloat(alertData.value),
          time_window: alertData.time_window
        },
        notification_channels: alertData.channels,
        last_triggered: null,
        trigger_count: 0,
        notifications_sent: []
      });
    },
    onSuccess: () => {
      toast.success('Alert created successfully');
      setCreateOpen(false);
      setFormData({
        name: '',
        description: '',
        metric: 'query_success_rate',
        operator: 'less_than',
        value: '',
        time_window: '1h',
        entity_type: '',
        entity_id: '',
        cooldown_minutes: 60,
        channels: [{ type: 'in_app', config: {} }]
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
    }
  });

  const handleAddChannel = (type) => {
    setFormData({
      ...formData,
      channels: [
        ...formData.channels,
        { type, config: type === 'email' ? { recipients: [] } : {} }
      ]
    });
  };

  const handleRemoveChannel = (index) => {
    setFormData({
      ...formData,
      channels: formData.channels.filter((_, i) => i !== index)
    });
  };

  const handleUpdateChannel = (index, config) => {
    const newChannels = [...formData.channels];
    newChannels[index] = { ...newChannels[index], config };
    setFormData({ ...formData, channels: newChannels });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.value) {
      toast.error('Please fill in all required fields');
      return;
    }
    createAlertMutation.mutate(formData);
  };

  const selectedMetric = METRICS.find(m => m.value === formData.metric);
  const selectedOperator = OPERATORS.find(o => o.value === formData.operator);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Bell className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Dashboard Alerts</h3>
            <p className="text-sm text-slate-500">
              Get notified when metrics cross thresholds
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Alert
        </Button>
      </div>

      {/* Create Alert Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Dashboard Alert</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label>Alert Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Low Query Success Rate"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this alert monitor?"
                  rows={2}
                />
              </div>
            </div>

            {/* Alert Condition */}
            <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Alert Condition
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Metric *</Label>
                  <Select 
                    value={formData.metric} 
                    onValueChange={(v) => setFormData({ ...formData, metric: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METRICS.map(metric => (
                        <SelectItem key={metric.value} value={metric.value}>
                          {metric.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Time Window</Label>
                  <Select 
                    value={formData.time_window} 
                    onValueChange={(v) => setFormData({ ...formData, time_window: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_WINDOWS.map(window => (
                        <SelectItem key={window.value} value={window.value}>
                          {window.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Operator *</Label>
                  <Select 
                    value={formData.operator} 
                    onValueChange={(v) => setFormData({ ...formData, operator: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map(op => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Threshold Value * {selectedMetric?.unit && `(${selectedMetric.unit})`}</Label>
                  <Input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="e.g., 80"
                  />
                </div>
              </div>

              {/* Condition Preview */}
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Alert when:</span> {selectedMetric?.label} in the last{' '}
                  {TIME_WINDOWS.find(w => w.value === formData.time_window)?.label} is{' '}
                  <span className="font-medium text-orange-600">
                    {selectedOperator?.label} {formData.value || '___'}{selectedMetric?.unit}
                  </span>
                </p>
              </div>
            </div>

            {/* Notification Channels */}
            <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notification Channels
                </h4>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddChannel('email')}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Add Email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddChannel('webhook')}
                  >
                    <Webhook className="h-3 w-3 mr-1" />
                    Add Webhook
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {formData.channels.map((channel, index) => (
                  <ChannelConfig
                    key={index}
                    channel={channel}
                    onUpdate={(config) => handleUpdateChannel(index, config)}
                    onRemove={() => handleRemoveChannel(index)}
                  />
                ))}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
              <h4 className="font-medium">Advanced Settings</h4>
              
              <div>
                <Label>Cooldown Period (minutes)</Label>
                <Input
                  type="number"
                  value={formData.cooldown_minutes}
                  onChange={(e) => setFormData({ ...formData, cooldown_minutes: parseInt(e.target.value) })}
                  placeholder="60"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Minimum time between alert notifications to prevent spam
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createAlertMutation.isPending}
            >
              Create Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChannelConfig({ channel, onUpdate, onRemove }) {
  const [recipients, setRecipients] = useState(channel.config?.recipients?.join(', ') || '');
  const [webhookUrl, setWebhookUrl] = useState(channel.config?.url || '');

  const handleSaveEmail = () => {
    onUpdate({
      recipients: recipients.split(',').map(r => r.trim()).filter(r => r)
    });
  };

  const handleSaveWebhook = () => {
    onUpdate({
      url: webhookUrl,
      headers: channel.config?.headers || {}
    });
  };

  if (channel.type === 'in_app') {
    return (
      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">In-App Notification</span>
        </div>
        <Badge variant="secondary">Enabled</Badge>
      </div>
    );
  }

  if (channel.type === 'email') {
    return (
      <div className="p-3 border border-slate-200 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium">Email Notification</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
        <div>
          <Label className="text-xs">Recipients (comma-separated)</Label>
          <Input
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            onBlur={handleSaveEmail}
            placeholder="user1@example.com, user2@example.com"
            className="text-sm"
          />
        </div>
      </div>
    );
  }

  if (channel.type === 'webhook') {
    return (
      <div className="p-3 border border-slate-200 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium">Webhook</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
        <div>
          <Label className="text-xs">Webhook URL</Label>
          <Input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            onBlur={handleSaveWebhook}
            placeholder="https://your-webhook-url.com"
            className="text-sm"
          />
        </div>
      </div>
    );
  }

  return null;
}
