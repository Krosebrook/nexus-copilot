import React, { useState } from 'react';
import { Plug, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from '@/lib/utils';

const INTEGRATIONS = [
  { id: 'slack', name: 'Slack', description: 'Team communication', color: 'bg-purple-100 text-purple-600' },
  { id: 'notion', name: 'Notion', description: 'Knowledge management', color: 'bg-slate-100 text-slate-600' },
  { id: 'github', name: 'GitHub', description: 'Code repositories', color: 'bg-slate-900 text-white' },
  { id: 'jira', name: 'Jira', description: 'Project tracking', color: 'bg-blue-100 text-blue-600' },
  { id: 'gmail', name: 'Gmail', description: 'Email integration', color: 'bg-red-100 text-red-600' },
  { id: 'googledrive', name: 'Google Drive', description: 'File storage', color: 'bg-green-100 text-green-600' },
];

export default function ConnectIntegrationsStep({ onNext, onSkip }) {
  const [selected, setSelected] = useState([]);

  const toggleIntegration = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    onNext({ selectedIntegrations: selected });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="h-16 w-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Plug className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect Your Tools</h2>
        <p className="text-slate-600">Select integrations to enhance your workflows</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {INTEGRATIONS.map((integration) => {
          const isSelected = selected.includes(integration.id);
          return (
            <Card
              key={integration.id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:shadow-md",
                isSelected ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"
              )}
              onClick={() => toggleIntegration(integration.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", integration.color)}>
                  <Plug className="h-5 w-5" />
                </div>
                {isSelected && (
                  <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{integration.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{integration.description}</p>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onSkip} className="flex-1">
          Skip for now
        </Button>
        <Button onClick={handleContinue} className="flex-1">
          {selected.length > 0 ? `Connect ${selected.length} integration${selected.length > 1 ? 's' : ''}` : 'Continue'}
        </Button>
      </div>
    </div>
  );
}