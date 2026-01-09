import React from 'react';
import { Info } from 'lucide-react';

const TRIGGER_INFO = {
  integration_event: 'Runs when an event occurs in a connected integration',
  copilot_query: 'Runs when Copilot generates a response',
  schedule: 'Runs on a recurring schedule',
  manual: 'Runs when manually triggered',
};

const STEP_EXAMPLES = [
  { type: 'send_notification', desc: 'Send a message to team channels' },
  { type: 'create_query', desc: 'Ask Copilot a follow-up question' },
  { type: 'send_email', desc: 'Email team members or external contacts' },
  { type: 'webhook', desc: 'Call external APIs or services' },
  { type: 'delay', desc: 'Wait before executing next step' },
];

export default function WorkflowSidebar({ workflow }) {
  return (
    <div className="w-80 bg-white border-l border-slate-200 p-6 overflow-auto">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Trigger Info
        </h3>
        <p className="text-sm text-slate-600">
          {TRIGGER_INFO[workflow.trigger_type]}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Available Actions</h3>
        <div className="space-y-2">
          {STEP_EXAMPLES.map((example) => (
            <div key={example.type} className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-900 mb-1">
                {example.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </p>
              <p className="text-xs text-slate-500">{example.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}