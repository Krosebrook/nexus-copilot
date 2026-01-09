import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ExternalLink } from 'lucide-react';

const AUTH_GUIDES = {
  slack: 'https://api.slack.com/authentication',
  notion: 'https://developers.notion.com/docs/authorization',
  github: 'https://docs.github.com/en/authentication',
};

export default function IntegrationCredentials({ integrationType, name, onUpdate }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Connect your {integrationType} account</h2>
      <p className="text-slate-500 mb-6">Provide your credentials to establish the connection</p>
      
      <div className="space-y-4">
        <div>
          <Label>Integration Name</Label>
          <Input
            value={name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={`My ${integrationType} Integration`}
          />
          <p className="text-xs text-slate-500 mt-1">A friendly name to identify this connection</p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 mb-2">
            You'll be redirected to {integrationType} to authorize access
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href={AUTH_GUIDES[integrationType]} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Authentication Guide
            </a>
          </Button>
        </div>

        <div className="pt-4">
          <p className="text-sm text-slate-600 mb-2">Required permissions:</p>
          <ul className="text-sm text-slate-500 space-y-1">
            <li>• Read workspace data</li>
            <li>• Send messages and notifications</li>
            <li>• Access user information</li>
          </ul>
        </div>
      </div>
    </div>
  );
}