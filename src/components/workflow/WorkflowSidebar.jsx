import React from 'react';
import { Info } from 'lucide-react';

const TRIGGER_INFO = {
  integration_event: 'Runs when an event occurs in a connected integration',
  copilot_query: 'Runs when Copilot generates a response',
  schedule: 'Runs on a recurring schedule',
  manual: 'Runs when manually triggered',
};

const STEP_EXAMPLES = [
  { type: 'condition', desc: 'Branch workflow based on conditions', category: 'Logic' },
  { type: 'transform', desc: 'Transform and manipulate data', category: 'Logic' },
  { type: 'integration_action', desc: 'Perform integration-specific actions', category: 'Integration' },
  { type: 'send_notification', desc: 'Send a message to team channels', category: 'Action' },
  { type: 'send_email', desc: 'Email team members or external contacts', category: 'Action' },
  { type: 'webhook', desc: 'Call external APIs or services', category: 'Action' },
  { type: 'delay', desc: 'Wait before executing next step', category: 'Utility' },
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
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Available Steps</h3>
        <div className="space-y-3">
          {['Logic', 'Integration', 'Action', 'Utility'].map(category => (
            <div key={category}>
              <p className="text-xs font-semibold text-slate-600 mb-1.5">{category}</p>
              <div className="space-y-1.5">
                {STEP_EXAMPLES.filter(e => e.category === category).map((example) => (
                  <div key={example.type} className="p-2.5 bg-slate-50 rounded-lg">
                    <p className="text-xs font-medium text-slate-900">
                      {example.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </p>
                    <p className="text-xs text-slate-500 leading-tight mt-0.5">{example.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}