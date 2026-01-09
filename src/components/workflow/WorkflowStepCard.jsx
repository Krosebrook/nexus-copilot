import React from 'react';
import { Trash2, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const STEP_TYPES = [
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'create_query', label: 'Create Copilot Query' },
  { value: 'update_integration', label: 'Update Integration' },
  { value: 'send_email', label: 'Send Email' },
  { value: 'webhook', label: 'Call Webhook' },
  { value: 'delay', label: 'Delay' },
];

export default function WorkflowStepCard({ step, index, isEditing, onUpdate, onRemove }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium">
            {index + 1}
          </div>
          <div>
            <p className="font-medium text-slate-900">Step {index + 1}</p>
          </div>
        </div>
        {isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Select
            value={step.config?.action}
            onValueChange={(action) => onUpdate({ config: { ...step.config, action } })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              {STEP_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {step.config?.action === 'send_email' && (
            <Input
              placeholder="Recipient email"
              value={step.config?.recipient || ''}
              onChange={(e) => onUpdate({ 
                config: { ...step.config, recipient: e.target.value } 
              })}
            />
          )}

          {step.config?.action === 'webhook' && (
            <Input
              placeholder="Webhook URL"
              value={step.config?.url || ''}
              onChange={(e) => onUpdate({ 
                config: { ...step.config, url: e.target.value } 
              })}
            />
          )}

          {step.config?.action === 'delay' && (
            <Input
              type="number"
              placeholder="Delay (seconds)"
              value={step.config?.duration || ''}
              onChange={(e) => onUpdate({ 
                config: { ...step.config, duration: e.target.value } 
              })}
            />
          )}
        </div>
      ) : (
        <div className="text-sm text-slate-600">
          {STEP_TYPES.find(t => t.value === step.config?.action)?.label || 'Not configured'}
          {step.config?.recipient && <span className="block text-slate-500">To: {step.config.recipient}</span>}
          {step.config?.url && <span className="block text-slate-500 truncate">URL: {step.config.url}</span>}
        </div>
      )}
    </div>
  );
}