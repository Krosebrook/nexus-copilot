import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  CheckCircle2, XCircle, AlertCircle, Info, 
  User, Settings, Database, Zap, FileText
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const EVENT_CONFIG = {
  success: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  warning: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
};

const ACTION_ICONS = {
  create: Database,
  update: Settings,
  delete: XCircle,
  execute: Zap,
  view: FileText,
  default: Info,
};

export default function ActivityTimeline({ events = [], compact = false }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Info className="h-8 w-8 mx-auto mb-2 text-slate-300" />
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((event, idx) => {
        const type = event.status === 'success' ? 'success' : 
                     event.status === 'failure' ? 'error' : 'info';
        const config = EVENT_CONFIG[type] || EVENT_CONFIG.info;
        const ActionIcon = ACTION_ICONS[event.action_category] || ACTION_ICONS.default;
        const Icon = config.icon;

        return (
          <div key={event.id || idx} className="flex gap-3 relative">
            {/* Timeline Line */}
            {idx < events.length - 1 && (
              <div className="absolute left-4 top-8 bottom-0 w-px bg-slate-200" />
            )}

            {/* Icon */}
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10",
              config.bg,
              config.border
            )}>
              <ActionIcon className={cn("h-4 w-4", config.color)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {event.action}
                  </p>
                  {event.details && !compact && (
                    <p className="text-xs text-slate-500 mt-1">
                      {typeof event.details === 'string' 
                        ? event.details 
                        : JSON.stringify(event.details)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">
                      {event.actor_email}
                    </span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-slate-400" title={format(new Date(event.created_date), 'PPpp')}>
                      {formatDistanceToNow(new Date(event.created_date), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                {event.status && (
                  <Badge 
                    variant={event.status === 'success' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {event.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}