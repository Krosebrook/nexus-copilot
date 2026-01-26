import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import WebhookSetupGuide from './WebhookSetupGuide';
import IntegrationEventGuide from './IntegrationEventGuide';

export default function TriggerConfigDialog({ open, onOpenChange, workflow, onSave }) {
  const [triggerType, setTriggerType] = useState(workflow?.trigger_type || 'manual');
  const [config, setConfig] = useState(workflow?.trigger_config || {});

  const handleSave = () => {
    onSave({ trigger_type: triggerType, trigger_config: config });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure Trigger</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Trigger Type</Label>
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual - Run on demand</SelectItem>
                <SelectItem value="schedule">Schedule - Run on a timer</SelectItem>
                <SelectItem value="webhook">Webhook - External HTTP trigger</SelectItem>
                <SelectItem value="integration_event">Integration Event - When something happens</SelectItem>
                <SelectItem value="copilot_query">Copilot Query - After AI response</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {triggerType === 'schedule' && (
            <>
              <div>
                <Label>Schedule Type</Label>
                <Select
                  value={config.schedule_type || 'interval'}
                  onValueChange={(schedule_type) => setConfig({ ...config, schedule_type })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interval">Interval</SelectItem>
                    <SelectItem value="cron">Cron Expression</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.schedule_type === 'interval' && (
                <div>
                  <Label>Interval (minutes)</Label>
                  <Input
                    type="number"
                    value={config.interval_minutes || '60'}
                    onChange={(e) => setConfig({ ...config, interval_minutes: e.target.value })}
                  />
                </div>
              )}

              {config.schedule_type === 'cron' && (
                <div>
                  <Label>Cron Expression</Label>
                  <Input
                    value={config.cron_expression || ''}
                    onChange={(e) => setConfig({ ...config, cron_expression: e.target.value })}
                    placeholder="0 9 * * 1-5"
                  />
                  <p className="text-xs text-slate-500 mt-1">Run at 9 AM on weekdays</p>
                </div>
              )}

              {config.schedule_type === 'daily' && (
                <div>
                  <Label>Time (24h format)</Label>
                  <Input
                    type="time"
                    value={config.time || '09:00'}
                    onChange={(e) => setConfig({ ...config, time: e.target.value })}
                  />
                </div>
              )}

              {config.schedule_type === 'weekly' && (
                <div>
                  <Label className="mb-2 block">Days of Week</Label>
                  <div className="space-y-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div key={day} className="flex items-center gap-2">
                        <Checkbox
                          checked={config.days?.includes(day)}
                          onCheckedChange={(checked) => {
                            const days = config.days || [];
                            setConfig({
                              ...config,
                              days: checked
                                ? [...days, day]
                                : days.filter(d => d !== day)
                            });
                          }}
                        />
                        <label className="text-sm">{day}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {triggerType === 'webhook' && (
            <>
              <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                <Label>Webhook URL</Label>
                <p className="text-xs text-slate-600 font-mono break-all">
                  {workflow?.id ? 
                    `${window.location.origin}/functions/webhookHandler?workflow_id=${workflow.id}&secret=${config.webhook_secret || 'GENERATE_SECRET'}` :
                    'Save workflow first to generate URL'}
                </p>
                <p className="text-xs text-slate-500">Use this URL in external services to trigger the workflow</p>
              </div>

              <div>
                <Label>Webhook Secret</Label>
                <Input
                  value={config.webhook_secret || ''}
                  onChange={(e) => setConfig({ ...config, webhook_secret: e.target.value })}
                  placeholder="Auto-generated secure token"
                />
                {!config.webhook_secret && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setConfig({ 
                      ...config, 
                      webhook_secret: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) 
                    })}
                  >
                    Generate Secret
                  </Button>
                )}
              </div>
            </>
          )}

          {triggerType === 'integration_event' && (
            <>
              <div>
                <Label>Integration Type</Label>
                <Select
                  value={config.integration_type || ''}
                  onValueChange={(integration_type) => setConfig({ ...config, integration_type, event_type: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select integration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="googledrive">Google Drive</SelectItem>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="jira">Jira</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.integration_type && (
                <div>
                  <Label>Event Type</Label>
                  <Select
                    value={config.event_type || ''}
                    onValueChange={(event_type) => setConfig({ ...config, event_type })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      {config.integration_type === 'googledrive' && (
                        <>
                          <SelectItem value="file.created">New File Created</SelectItem>
                          <SelectItem value="file.updated">File Updated</SelectItem>
                          <SelectItem value="file.deleted">File Deleted</SelectItem>
                        </>
                      )}
                      {config.integration_type === 'gmail' && (
                        <>
                          <SelectItem value="email.received">New Email Received</SelectItem>
                          <SelectItem value="email.sent">Email Sent</SelectItem>
                        </>
                      )}
                      {config.integration_type === 'jira' && (
                        <>
                          <SelectItem value="issue.created">New Issue Created</SelectItem>
                          <SelectItem value="issue.updated">Issue Updated</SelectItem>
                          <SelectItem value="issue.status_changed">Issue Status Changed</SelectItem>
                        </>
                      )}
                      {config.integration_type === 'slack' && (
                        <>
                          <SelectItem value="message.posted">Message Posted</SelectItem>
                          <SelectItem value="channel.created">Channel Created</SelectItem>
                        </>
                      )}
                      {config.integration_type === 'github' && (
                        <>
                          <SelectItem value="push">Code Pushed</SelectItem>
                          <SelectItem value="pull_request.opened">Pull Request Opened</SelectItem>
                          <SelectItem value="issue.opened">Issue Opened</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {config.integration_type && config.event_type && (
                <>
                  <IntegrationEventGuide
                    integrationType={config.integration_type}
                    eventType={config.event_type}
                  />
                  <WebhookSetupGuide
                    integrationType={config.integration_type}
                    webhookUrl={workflow?.id ? 
                      `${window.location.origin}/functions/webhookHandler?workflow_id=${workflow.id}&secret=${config.webhook_secret || 'GENERATE_SECRET'}` :
                      'Save workflow first'}
                  />
                </>
              )}

              {config.integration_type && !config.webhook_secret && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfig({ 
                    ...config, 
                    webhook_secret: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) 
                  })}
                >
                  Generate Webhook Secret
                </Button>
              )}
            </>
          )}

          {triggerType === 'copilot_query' && (
            <div>
              <Label>Query Filter (optional)</Label>
              <Input
                value={config.query_filter || ''}
                onChange={(e) => setConfig({ ...config, query_filter: e.target.value })}
                placeholder="Keywords to match in query"
              />
              <p className="text-xs text-slate-500 mt-1">Leave empty to trigger on all queries</p>
            </div>
          )}

          <Button onClick={handleSave} className="w-full">
            Save Trigger Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}