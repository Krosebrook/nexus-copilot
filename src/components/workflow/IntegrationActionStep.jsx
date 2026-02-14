import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, Plus, CheckSquare, FileText, Bell } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INTEGRATION_ACTIONS = {
  slack: [
    { id: 'post_message', label: 'Post Message', icon: Send, fields: ['channel', 'message'] },
    { id: 'send_dm', label: 'Send Direct Message', icon: Send, fields: ['user', 'message'] },
  ],
  notion: [
    { id: 'create_page', label: 'Create Page', icon: FileText, fields: ['database_id', 'title', 'content'] },
    { id: 'update_page', label: 'Update Page', icon: FileText, fields: ['page_id', 'content'] },
  ],
  linear: [
    { id: 'create_issue', label: 'Create Issue', icon: CheckSquare, fields: ['team_id', 'title', 'description', 'priority'] },
  ],
  jira: [
    { id: 'create_task', label: 'Create Task', icon: CheckSquare, fields: ['project_key', 'summary', 'description'] },
  ],
};

export default function IntegrationActionStep({ config = {}, onChange, orgId }) {
  const [selectedIntegration, setSelectedIntegration] = useState(config.integration_type || '');
  const [selectedAction, setSelectedAction] = useState(config.action_id || '');
  const [actionParams, setActionParams] = useState(config.parameters || {});

  const { data: integrations = [] } = useQuery({
    queryKey: ['active-integrations', orgId],
    queryFn: () => base44.entities.Integration.filter({ org_id: orgId, status: 'active' }),
    enabled: !!orgId,
  });

  const handleIntegrationChange = (integrationType) => {
    setSelectedIntegration(integrationType);
    setSelectedAction('');
    setActionParams({});
    onChange?.({
      integration_type: integrationType,
      action_id: '',
      parameters: {},
    });
  };

  const handleActionChange = (actionId) => {
    setSelectedAction(actionId);
    onChange?.({
      integration_type: selectedIntegration,
      action_id: actionId,
      parameters: actionParams,
    });
  };

  const handleParamChange = (field, value) => {
    const newParams = { ...actionParams, [field]: value };
    setActionParams(newParams);
    onChange?.({
      integration_type: selectedIntegration,
      action_id: selectedAction,
      parameters: newParams,
    });
  };

  const availableActions = selectedIntegration ? INTEGRATION_ACTIONS[selectedIntegration] || [] : [];
  const currentAction = availableActions.find(a => a.id === selectedAction);

  return (
    <div className="space-y-4">
      <div>
        <Label>Integration</Label>
        <Select value={selectedIntegration} onValueChange={handleIntegrationChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select integration" />
          </SelectTrigger>
          <SelectContent>
            {integrations.map((integration) => (
              <SelectItem key={integration.id} value={integration.type}>
                {integration.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedIntegration && (
        <div>
          <Label>Action</Label>
          <Select value={selectedAction} onValueChange={handleActionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              {availableActions.map((action) => (
                <SelectItem key={action.id} value={action.id}>
                  <div className="flex items-center gap-2">
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {currentAction && (
        <Card className="p-4 bg-slate-50 border-slate-200">
          <p className="text-sm font-medium text-slate-700 mb-3">Configure Action</p>
          <div className="space-y-3">
            {currentAction.fields.map((field) => (
              <div key={field}>
                <Label className="text-xs">{field.replace('_', ' ').toUpperCase()}</Label>
                {field.includes('message') || field.includes('content') || field.includes('description') ? (
                  <Textarea
                    value={actionParams[field] || ''}
                    onChange={(e) => handleParamChange(field, e.target.value)}
                    placeholder={`Enter ${field}`}
                    className="text-sm"
                  />
                ) : (
                  <Input
                    value={actionParams[field] || ''}
                    onChange={(e) => handleParamChange(field, e.target.value)}
                    placeholder={`Enter ${field}`}
                    className="text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}