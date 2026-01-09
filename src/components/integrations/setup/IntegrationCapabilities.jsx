import React, { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const CAPABILITY_OPTIONS = {
  slack: [
    { id: 'read_messages', label: 'Read Messages', desc: 'Access channel messages' },
    { id: 'send_messages', label: 'Send Messages', desc: 'Post to channels' },
    { id: 'user_info', label: 'User Information', desc: 'Access user profiles' },
    { id: 'channel_list', label: 'Channel List', desc: 'View available channels' },
  ],
  notion: [
    { id: 'read_pages', label: 'Read Pages', desc: 'Access workspace pages' },
    { id: 'create_pages', label: 'Create Pages', desc: 'Create new pages' },
    { id: 'update_pages', label: 'Update Pages', desc: 'Modify existing pages' },
    { id: 'search', label: 'Search', desc: 'Search workspace content' },
  ],
  github: [
    { id: 'read_repos', label: 'Read Repositories', desc: 'Access repository data' },
    { id: 'read_issues', label: 'Read Issues', desc: 'View issues and PRs' },
    { id: 'create_issues', label: 'Create Issues', desc: 'Create new issues' },
    { id: 'webhooks', label: 'Webhooks', desc: 'Receive event notifications' },
  ],
};

export default function IntegrationCapabilities({ integrationType, selected, onUpdate }) {
  const [capabilities, setCapabilities] = useState(selected);
  const [webhookUrl, setWebhookUrl] = useState('');
  
  const options = CAPABILITY_OPTIONS[integrationType] || [];

  const handleToggle = (capabilityId) => {
    const updated = capabilities.includes(capabilityId)
      ? capabilities.filter(c => c !== capabilityId)
      : [...capabilities, capabilityId];
    setCapabilities(updated);
    onUpdate(updated, { webhook_url: webhookUrl });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Configure features</h2>
      <p className="text-slate-500 mb-6">Select which capabilities you want to enable</p>
      
      <div className="space-y-4 mb-6">
        {options.map((option) => (
          <div key={option.id} className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg">
            <Checkbox
              checked={capabilities.includes(option.id)}
              onCheckedChange={() => handleToggle(option.id)}
              id={option.id}
            />
            <div className="flex-1">
              <Label htmlFor={option.id} className="font-medium cursor-pointer">
                {option.label}
              </Label>
              <p className="text-sm text-slate-500">{option.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <Label>Webhook URL (Optional)</Label>
        <Input
          value={webhookUrl}
          onChange={(e) => {
            setWebhookUrl(e.target.value);
            onUpdate(capabilities, { webhook_url: e.target.value });
          }}
          placeholder="https://your-domain.com/webhook"
        />
        <p className="text-xs text-slate-500 mt-1">Receive real-time event notifications</p>
      </div>
    </div>
  );
}