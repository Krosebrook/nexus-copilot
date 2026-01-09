import React from 'react';
import { Trash2, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const STEP_TYPES = [
  { value: 'send_notification', label: 'Send Notification', category: 'action' },
  { value: 'create_query', label: 'Create Copilot Query', category: 'action' },
  { value: 'send_email', label: 'Send Email', category: 'action' },
  { value: 'webhook', label: 'Call Webhook', category: 'action' },
  { value: 'integration_action', label: 'Integration Action', category: 'action' },
  { value: 'ai_agent', label: 'AI Agent Task', category: 'ai' },
  { value: 'knowledge_query', label: 'Query Knowledge Base', category: 'ai' },
  { value: 'condition', label: 'If/Else Condition', category: 'logic' },
  { value: 'transform', label: 'Transform Data', category: 'logic' },
  { value: 'delay', label: 'Delay', category: 'utility' },
];

export default function WorkflowStepCard({ step, index, isEditing, onUpdate, onRemove }) {
  const stepType = STEP_TYPES.find(t => t.value === step.config?.action);
  const isCondition = step.config?.action === 'condition';
  const isAI = stepType?.category === 'ai';
  
  return (
    <div className={`border rounded-lg p-4 ${
      isCondition ? 'bg-purple-50 border-purple-200' : 
      isAI ? 'bg-blue-50 border-blue-200' :
      'bg-white border-slate-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
            isCondition ? 'bg-purple-500 text-white' : 
            isAI ? 'bg-blue-500 text-white' :
            'bg-slate-100'
          }`}>
            {isCondition ? '?' : isAI ? '🤖' : index + 1}
          </div>
          <div>
            <p className="font-medium text-slate-900">
              {isCondition ? 'Condition' : `Step ${index + 1}`}
            </p>
            {stepType && (
              <p className="text-xs text-slate-500 capitalize">{stepType.category}</p>
            )}
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

          {step.config?.action === 'integration_action' && (
            <>
              <Select
                value={step.config?.integration_type || ''}
                onValueChange={(integration_type) => onUpdate({ 
                  config: { ...step.config, integration_type } 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select integration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slack">Slack - Post Message</SelectItem>
                  <SelectItem value="notion">Notion - Create Page</SelectItem>
                  <SelectItem value="github">GitHub - Create Issue</SelectItem>
                  <SelectItem value="jira">Jira - Update Ticket</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Action parameters (JSON)"
                value={step.config?.params || ''}
                onChange={(e) => onUpdate({ 
                  config: { ...step.config, params: e.target.value } 
                })}
              />
            </>
          )}

          {step.config?.action === 'condition' && (
            <>
              <Input
                placeholder="Condition (e.g., status === 'completed')"
                value={step.config?.condition || ''}
                onChange={(e) => onUpdate({ 
                  config: { ...step.config, condition: e.target.value } 
                })}
              />
              <div className="text-xs text-slate-500 mt-1">
                When condition is true, workflow continues. When false, it stops or branches.
              </div>
            </>
          )}

          {step.config?.action === 'transform' && (
            <>
              <Input
                placeholder="Transform expression (e.g., data.toLowerCase())"
                value={step.config?.expression || ''}
                onChange={(e) => onUpdate({ 
                  config: { ...step.config, expression: e.target.value } 
                })}
              />
              <Input
                placeholder="Output variable name"
                value={step.config?.output_var || ''}
                onChange={(e) => onUpdate({ 
                  config: { ...step.config, output_var: e.target.value } 
                })}
              />
            </>
          )}

          {step.config?.action === 'ai_agent' && (
            <>
              <Input
                placeholder="Agent goal (e.g., analyze data and create report)"
                value={step.config?.agent_goal || ''}
                onChange={(e) => onUpdate({ 
                  config: { ...step.config, agent_goal: e.target.value } 
                })}
              />
              <Select
                value={step.config?.agent_autonomy || 'supervised'}
                onValueChange={(agent_autonomy) => onUpdate({ 
                  config: { ...step.config, agent_autonomy } 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Autonomy level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supervised">Supervised - Confirm actions</SelectItem>
                  <SelectItem value="semi_autonomous">Semi-autonomous - Auto-approve safe actions</SelectItem>
                  <SelectItem value="autonomous">Autonomous - Full self-direction</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Max steps (default: 10)"
                type="number"
                value={step.config?.max_steps || '10'}
                onChange={(e) => onUpdate({ 
                  config: { ...step.config, max_steps: e.target.value } 
                })}
              />
            </>
          )}

          {step.config?.action === 'knowledge_query' && (
            <>
              <Input
                placeholder="Search query or keywords"
                value={step.config?.query || ''}
                onChange={(e) => onUpdate({ 
                  config: { ...step.config, query: e.target.value } 
                })}
              />
              <Input
                placeholder="Category filter (optional)"
                value={step.config?.category_filter || ''}
                onChange={(e) => onUpdate({ 
                  config: { ...step.config, category_filter: e.target.value } 
                })}
              />
            </>
          )}
        </div>
      ) : (
        <div className="text-sm text-slate-600">
          {STEP_TYPES.find(t => t.value === step.config?.action)?.label || 'Not configured'}
          {step.config?.recipient && <span className="block text-slate-500">To: {step.config.recipient}</span>}
          {step.config?.url && <span className="block text-slate-500 truncate">URL: {step.config.url}</span>}
          {step.config?.condition && <span className="block text-slate-500">If: {step.config.condition}</span>}
          {step.config?.integration_type && <span className="block text-slate-500 capitalize">{step.config.integration_type}</span>}
          {step.config?.expression && <span className="block text-slate-500">Transform: {step.config.expression}</span>}
          {step.config?.agent_goal && <span className="block text-slate-500">Goal: {step.config.agent_goal}</span>}
          {step.config?.query && <span className="block text-slate-500">Query: {step.config.query}</span>}
        </div>
      )}
    </div>
  );
}