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

          {triggerType === 'integration_event' && (
            <>
              <div>
                <Label>Integration Type</Label>
                <Select
                  value={config.integration_type || ''}
                  onValueChange={(integration_type) => setConfig({ ...config, integration_type })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select integration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="notion">Notion</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="jira">Jira</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Event Type</Label>
                <Input
                  value={config.event_type || ''}
                  onChange={(e) => setConfig({ ...config, event_type: e.target.value })}
                  placeholder="e.g., new_message, issue_created"
                />
              </div>
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