import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IntegrationActionStep from './IntegrationActionStep';

const ACTION_TYPES = [
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'create_query', label: 'Create Copilot Query' },
  { value: 'send_email', label: 'Send Email' },
  { value: 'webhook', label: 'Call Webhook' },
  { value: 'integration_action', label: 'Integration Action' },
  { value: 'ai_agent', label: 'Run AI Agent' },
  { value: 'knowledge_query', label: 'Query Knowledge Base' },
  { value: 'create_entity', label: 'Create Entity Record' },
  { value: 'update_entity', label: 'Update Entity Record' },
];

export default function StepConfigPanel({ step, workflow, onUpdate, onClose, orgId }) {
  const [localStep, setLocalStep] = useState(step);

  const handleSave = () => {
    onUpdate(localStep);
  };

  const updateConfig = (key, value) => {
    setLocalStep({
      ...localStep,
      config: { ...localStep.config, [key]: value }
    });
  };

  const updateErrorConfig = (key, value) => {
    setLocalStep({
      ...localStep,
      error_config: { ...localStep.error_config, [key]: value }
    });
  };

  const addDataMapping = () => {
    const mappings = localStep.config?.data_mapping || {};
    updateConfig('data_mapping', { ...mappings, '': '' });
  };

  const updateDataMapping = (oldKey, newKey, value) => {
    const mappings = { ...localStep.config?.data_mapping };
    if (oldKey !== newKey && oldKey) {
      delete mappings[oldKey];
    }
    if (newKey) {
      mappings[newKey] = value;
    }
    updateConfig('data_mapping', mappings);
  };

  const removeDataMapping = (key) => {
    const mappings = { ...localStep.config?.data_mapping };
    delete mappings[key];
    updateConfig('data_mapping', mappings);
  };

  return (
    <div className="w-96 border-l border-slate-200 bg-white overflow-auto">
      <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
        <h3 className="font-semibold text-slate-900">Configure Step</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Step Label</Label>
              <Input
                value={localStep.config?.label || ''}
                onChange={(e) => updateConfig('label', e.target.value)}
                placeholder="Step name"
              />
            </div>

            {localStep.type === 'action' && (
              <div className="space-y-2">
                <Label>Action Type</Label>
                <Select
                  value={localStep.config?.action}
                  onValueChange={(value) => updateConfig('action', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {localStep.type === 'condition' && (
              <div className="space-y-2">
                <Label>Condition Expression</Label>
                <Textarea
                  value={localStep.config?.condition || ''}
                  onChange={(e) => updateConfig('condition', e.target.value)}
                  placeholder="e.g., data.status === 'approved'"
                  rows={3}
                />
                <p className="text-xs text-slate-500">
                  Use JavaScript expressions. Access trigger data via 'data' variable.
                </p>
              </div>
            )}

            {localStep.type === 'loop' && (
              <>
                <div className="space-y-2">
                  <Label>Loop Source</Label>
                  <Input
                    value={localStep.config?.loop_source || ''}
                    onChange={(e) => updateConfig('loop_source', e.target.value)}
                    placeholder="e.g., data.items"
                  />
                  <p className="text-xs text-slate-500">Array to iterate over</p>
                </div>
                <div className="space-y-2">
                  <Label>Item Variable Name</Label>
                  <Input
                    value={localStep.config?.loop_variable || 'item'}
                    onChange={(e) => updateConfig('loop_variable', e.target.value)}
                    placeholder="item"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Iterations</Label>
                  <Input
                    type="number"
                    value={localStep.config?.max_iterations || 100}
                    onChange={(e) => updateConfig('max_iterations', parseInt(e.target.value))}
                  />
                </div>
              </>
            )}

            {localStep.type === 'parallel' && (
              <div className="space-y-2">
                <Label>Parallel Branches</Label>
                <p className="text-xs text-slate-500 mb-2">
                  Execute multiple actions simultaneously
                </p>
                <Input
                  type="number"
                  value={localStep.config?.parallel_branches?.length || 2}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 2;
                    updateConfig('parallel_branches', Array(count).fill({}));
                  }}
                  min="2"
                  max="10"
                />
              </div>
            )}

            {/* Action-specific fields */}
            {localStep.config?.action === 'send_email' && (
              <>
                <div className="space-y-2">
                  <Label>Recipient</Label>
                  <Input
                    value={localStep.config?.recipient || ''}
                    onChange={(e) => updateConfig('recipient', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={localStep.config?.subject || ''}
                    onChange={(e) => updateConfig('subject', e.target.value)}
                    placeholder="Email subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body Template</Label>
                  <Textarea
                    value={localStep.config?.body || ''}
                    onChange={(e) => updateConfig('body', e.target.value)}
                    placeholder="Email body (supports variables)"
                    rows={4}
                  />
                </div>
              </>
            )}

            {localStep.config?.action === 'webhook' && (
              <>
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input
                    value={localStep.config?.url || ''}
                    onChange={(e) => updateConfig('url', e.target.value)}
                    placeholder="https://api.example.com/webhook"
                  />
                </div>
                <div className="space-y-2">
                  <Label>HTTP Method</Label>
                  <Select
                    value={localStep.config?.method || 'POST'}
                    onValueChange={(value) => updateConfig('method', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {(localStep.config?.action === 'create_entity' || localStep.config?.action === 'update_entity') && (
              <>
                <div className="space-y-2">
                  <Label>Entity Name</Label>
                  <Input
                    value={localStep.config?.entity_name || ''}
                    onChange={(e) => updateConfig('entity_name', e.target.value)}
                    placeholder="e.g., Task, Project"
                  />
                </div>
              </>
            )}

            {localStep.config?.action === 'ai_agent' && (
              <>
                <div className="space-y-2">
                  <Label>Agent Task</Label>
                  <Textarea
                    value={localStep.config?.agent_task || ''}
                    onChange={(e) => updateConfig('agent_task', e.target.value)}
                    placeholder="Describe what the agent should do..."
                    rows={3}
                  />
                  <p className="text-xs text-slate-500">
                    The agent will plan and execute this task autonomously
                  </p>
                </div>
              </>
            )}

            {localStep.config?.action === 'integration_action' && orgId && (
              <IntegrationActionStep
                config={localStep.config}
                onChange={(integrationConfig) => {
                  setLocalStep({
                    ...localStep,
                    config: {
                      ...localStep.config,
                      ...integrationConfig
                    }
                  });
                }}
                orgId={orgId}
              />
            )}
          </TabsContent>

          {/* Data Mapping Tab */}
          <TabsContent value="data" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Data Flow Mapping</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addDataMapping}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Map data from previous steps or trigger to this step
              </p>
              
              <div className="space-y-2">
                {Object.entries(localStep.config?.data_mapping || {}).map(([key, value], idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Field name"
                      value={key}
                      onChange={(e) => updateDataMapping(key, e.target.value, value)}
                      className="flex-1"
                    />
                    <span className="text-slate-400">←</span>
                    <Input
                      placeholder="Source (e.g., trigger.data.id)"
                      value={value}
                      onChange={(e) => updateDataMapping(key, key, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDataMapping(key)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                ))}
                {(!localStep.config?.data_mapping || Object.keys(localStep.config.data_mapping).length === 0) && (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No data mappings yet
                  </p>
                )}
              </div>
            </div>

            <Card className="bg-slate-50 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Available Variables</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 space-y-1">
                <p><code className="bg-white px-1.5 py-0.5 rounded">trigger.data</code> - Trigger payload</p>
                <p><code className="bg-white px-1.5 py-0.5 rounded">steps.stepName</code> - Previous step output</p>
                <p><code className="bg-white px-1.5 py-0.5 rounded">workflow.id</code> - Workflow ID</p>
                <p><code className="bg-white px-1.5 py-0.5 rounded">execution.id</code> - Execution ID</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Error Handling Tab */}
          <TabsContent value="errors" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Enable Retry</Label>
                  <p className="text-xs text-slate-500">
                    Automatically retry on failure
                  </p>
                </div>
                <Switch
                  checked={localStep.error_config?.retry_enabled || false}
                  onCheckedChange={(checked) => updateErrorConfig('retry_enabled', checked)}
                />
              </div>

              {localStep.error_config?.retry_enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Retry Count</Label>
                    <Input
                      type="number"
                      value={localStep.error_config?.retry_count || 3}
                      onChange={(e) => updateErrorConfig('retry_count', parseInt(e.target.value))}
                      min="1"
                      max="10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Retry Delay (seconds)</Label>
                    <Select
                      value={String(localStep.error_config?.retry_delay_seconds || 60)}
                      onValueChange={(value) => updateErrorConfig('retry_delay_seconds', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                        <SelectItem value="600">10 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Continue on Error</Label>
                  <p className="text-xs text-slate-500">
                    Don't stop workflow if this step fails
                  </p>
                </div>
                <Switch
                  checked={localStep.error_config?.continue_on_error || false}
                  onCheckedChange={(checked) => updateErrorConfig('continue_on_error', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Fallback Step (Optional)</Label>
                <Select
                  value={localStep.error_config?.fallback_step_id || ''}
                  onValueChange={(value) => updateErrorConfig('fallback_step_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {workflow.steps?.filter(s => s.id !== step.id).map((s, idx) => (
                      <SelectItem key={s.id} value={s.id}>
                        Step {idx + 1}: {s.config?.label || s.config?.action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Jump to this step if current step fails
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-200">
          <Button onClick={handleSave} className="w-full">
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}