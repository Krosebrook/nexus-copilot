import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Zap, TrendingUp, Calendar, MessageSquare, Activity, Trash2 } from 'lucide-react';
import { toast } from "sonner";
import { format } from 'date-fns';

const TRIGGER_TYPES = [
  { value: 'data_anomaly', label: 'Data Anomaly', icon: TrendingUp, description: 'Detect unusual patterns in data' },
  { value: 'entity_pattern', label: 'Entity Pattern', icon: Activity, description: 'Monitor entity conditions' },
  { value: 'metric_threshold', label: 'Metric Threshold', icon: Zap, description: 'Track metric values' },
  { value: 'calendar_event', label: 'Calendar Event', icon: Calendar, description: 'Upcoming calendar events' },
  { value: 'message_received', label: 'Message Received', icon: MessageSquare, description: 'New messages' },
  { value: 'schedule', label: 'Schedule', icon: Activity, description: 'Periodic checks' },
];

export default function ProactiveTriggersPanel({ agent, orgId }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: 'data_anomaly',
    agent_task_template: '',
    trigger_config: {},
    cooldown_minutes: 60,
    is_active: true,
  });

  const queryClient = useQueryClient();

  const { data: monitors = [], isLoading } = useQuery({
    queryKey: ['agent-monitors', agent.id],
    queryFn: () => base44.entities.AgentMonitor.filter({ agent_id: agent.id, org_id: orgId }),
    enabled: !!agent.id && !!orgId,
  });

  const { data: entities = [] } = useQuery({
    queryKey: ['org-entities', orgId],
    queryFn: async () => {
      // Get available entities for this org by checking recent data
      const knownEntities = ['Query', 'KnowledgeBase', 'Workflow', 'AgentExecution', 'Integration'];
      return knownEntities;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.AgentMonitor.create({
        ...data,
        org_id: orgId,
        agent_id: agent.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-monitors'] });
      toast.success('Proactive trigger created');
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create trigger: ' + error.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      await base44.entities.AgentMonitor.update(id, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-monitors'] });
      toast.success('Trigger updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.AgentMonitor.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-monitors'] });
      toast.success('Trigger deleted');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      trigger_type: 'data_anomaly',
      agent_task_template: '',
      trigger_config: {},
      cooldown_minutes: 60,
      is_active: true,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getTriggerIcon = (type) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === type);
    return trigger?.icon || Zap;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Proactive Triggers</h3>
          <p className="text-sm text-slate-500">Configure autonomous agent activation</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Trigger
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : monitors.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500 mb-1">No proactive triggers configured</p>
            <p className="text-sm text-slate-400 mb-4">Enable autonomous agent activation</p>
            <Button onClick={() => setDialogOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create First Trigger
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {monitors.map((monitor) => {
            const Icon = getTriggerIcon(monitor.trigger_type);
            return (
              <Card key={monitor.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{monitor.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {TRIGGER_TYPES.find(t => t.value === monitor.trigger_type)?.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={monitor.is_active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: monitor.id, is_active: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(monitor.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <Badge variant="secondary">{monitor.trigger_type.replace('_', ' ')}</Badge>
                    <span>•</span>
                    <span>Triggered {monitor.trigger_count || 0} times</span>
                    {monitor.last_triggered_at && (
                      <>
                        <span>•</span>
                        <span>Last: {format(new Date(monitor.last_triggered_at), 'MMM d, h:mm a')}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>Cooldown: {monitor.cooldown_minutes}m</span>
                  </div>
                  {monitor.agent_task_template && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                      Task: {monitor.agent_task_template}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Proactive Trigger</DialogTitle>
            <DialogDescription>
              Configure conditions that will autonomously activate this agent
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Trigger Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., High Query Volume Alert"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                {TRIGGER_TYPES.find(t => t.value === formData.trigger_type)?.description}
              </p>
            </div>

            {(formData.trigger_type === 'data_anomaly' || formData.trigger_type === 'entity_pattern' || formData.trigger_type === 'metric_threshold') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entity</Label>
                  <Select
                    value={formData.trigger_config.entity_name || ''}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      trigger_config: { ...formData.trigger_config, entity_name: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map((entity) => (
                        <SelectItem key={entity} value={entity}>
                          {entity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Field</Label>
                  <Input
                    value={formData.trigger_config.field_name || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      trigger_config: { ...formData.trigger_config, field_name: e.target.value }
                    })}
                    placeholder="e.g., latency_ms"
                  />
                </div>
              </div>
            )}

            {formData.trigger_type === 'metric_threshold' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select
                    value={formData.trigger_config.condition || 'greater_than'}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      trigger_config: { ...formData.trigger_config, condition: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="greater_than">Greater than</SelectItem>
                      <SelectItem value="less_than">Less than</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Threshold</Label>
                  <Input
                    type="number"
                    value={formData.trigger_config.threshold || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      trigger_config: { ...formData.trigger_config, threshold: parseFloat(e.target.value) }
                    })}
                    placeholder="100"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Agent Task Template</Label>
              <Textarea
                value={formData.agent_task_template}
                onChange={(e) => setFormData({ ...formData, agent_task_template: e.target.value })}
                placeholder="Analyze the unusual pattern in {entity_name} and provide recommendations"
                rows={3}
                required
              />
              <p className="text-xs text-slate-500">
                Use {'{trigger_type}'}, {'{timestamp}'}, {'{context}'} as placeholders
              </p>
            </div>

            <div className="space-y-2">
              <Label>Cooldown (minutes)</Label>
              <Input
                type="number"
                value={formData.cooldown_minutes}
                onChange={(e) => setFormData({ ...formData, cooldown_minutes: parseInt(e.target.value) })}
                min={5}
                required
              />
              <p className="text-xs text-slate-500">
                Minimum time between trigger activations
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Create Trigger
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}