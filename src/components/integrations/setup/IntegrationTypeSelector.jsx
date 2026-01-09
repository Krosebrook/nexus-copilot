import React from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const INTEGRATION_TYPES = [
  { id: 'slack', name: 'Slack', icon: '💬', description: 'Team communication' },
  { id: 'notion', name: 'Notion', icon: '📝', description: 'Knowledge base' },
  { id: 'github', name: 'GitHub', icon: '🐙', description: 'Code repository' },
  { id: 'jira', name: 'Jira', icon: '📊', description: 'Project tracking' },
  { id: 'linear', name: 'Linear', icon: '📈', description: 'Issue tracking' },
  { id: 'confluence', name: 'Confluence', icon: '🌐', description: 'Documentation' },
];

export default function IntegrationTypeSelector({ selected, onSelect }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Choose a service to connect</h2>
      <p className="text-slate-500 mb-6">Select the integration you want to add to your workspace</p>
      
      <div className="grid grid-cols-2 gap-4">
        {INTEGRATION_TYPES.map((type) => (
          <Card
            key={type.id}
            className={cn(
              "p-6 cursor-pointer transition-all hover:shadow-md",
              selected === type.id ? "border-2 border-slate-900 bg-slate-50" : "border border-slate-200"
            )}
            onClick={() => onSelect(type.id, type.name)}
          >
            <div className="text-4xl mb-3">{type.icon}</div>
            <h3 className="font-semibold text-slate-900 mb-1">{type.name}</h3>
            <p className="text-sm text-slate-500">{type.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}