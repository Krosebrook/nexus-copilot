import React from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle, AlertCircle, Clock, Settings, RefreshCw, Trash2,
  MessageSquare, FileText, Github, Trello, Link
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const INTEGRATION_ICONS = {
  slack: MessageSquare,
  notion: FileText,
  confluence: FileText,
  github: Github,
  jira: Trello,
  linear: Trello,
  custom_webhook: Link,
};

const STATUS_CONFIG = {
  active: { icon: CheckCircle, color: 'text-green-500', label: 'Connected' },
  inactive: { icon: Clock, color: 'text-slate-400', label: 'Inactive' },
  error: { icon: AlertCircle, color: 'text-red-500', label: 'Error' },
  pending_auth: { icon: Clock, color: 'text-amber-500', label: 'Pending Auth' },
};

export default function IntegrationCard({ 
  integration, 
  onToggle, 
  onSync,
  onConfigure,
  onRemove 
}) {
  const IntegrationIcon = INTEGRATION_ICONS[integration.type] || Link;
  const statusConfig = STATUS_CONFIG[integration.status] || STATUS_CONFIG.inactive;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
          <IntegrationIcon className="h-6 w-6 text-slate-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-slate-900">{integration.name}</h3>
            <Badge variant="outline" className="text-xs capitalize">
              {integration.type.replace('_', ' ')}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
            <span className={cn("text-sm", statusConfig.color)}>{statusConfig.label}</span>
          </div>

          {integration.error_message && (
            <p className="text-sm text-red-600 mb-2">{integration.error_message}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500">
            {integration.last_sync_at && (
              <span>
                Last sync: {format(new Date(integration.last_sync_at), 'MMM d, h:mm a')}
              </span>
            )}
            {integration.sync_count > 0 && (
              <span>{integration.sync_count} syncs</span>
            )}
          </div>

          {integration.capabilities?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {integration.capabilities.map((cap) => (
                <Badge key={cap} variant="secondary" className="text-xs">
                  {cap}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <Switch
            checked={integration.status === 'active'}
            onCheckedChange={() => onToggle?.(integration)}
          />
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSync?.(integration)}
              disabled={integration.status !== 'active'}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onConfigure?.(integration)}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove?.(integration)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}