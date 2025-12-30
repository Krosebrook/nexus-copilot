import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  MessageSquare, UserPlus, Settings, Database, 
  Plug, Shield, AlertCircle, CheckCircle
} from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const ACTION_CONFIG = {
  query_created: { icon: MessageSquare, color: 'bg-blue-100 text-blue-600', label: 'Asked a question' },
  member_invited: { icon: UserPlus, color: 'bg-green-100 text-green-600', label: 'Invited member' },
  member_joined: { icon: UserPlus, color: 'bg-green-100 text-green-600', label: 'Joined team' },
  settings_updated: { icon: Settings, color: 'bg-amber-100 text-amber-600', label: 'Updated settings' },
  integration_connected: { icon: Plug, color: 'bg-cyan-100 text-cyan-600', label: 'Connected integration' },
  role_changed: { icon: Shield, color: 'bg-purple-100 text-purple-600', label: 'Changed role' },
  approval_requested: { icon: AlertCircle, color: 'bg-amber-100 text-amber-600', label: 'Requested approval' },
  approval_decided: { icon: CheckCircle, color: 'bg-green-100 text-green-600', label: 'Approval decided' },
  data_exported: { icon: Database, color: 'bg-slate-100 text-slate-600', label: 'Exported data' },
};

export default function ActivityFeed({ activities = [], loading = false, compact = false }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
              <div className="h-3 w-1/4 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No recent activity</p>
      </div>
    );
  }

  const Component = compact ? 'div' : ScrollArea;
  const componentProps = compact ? {} : { className: "h-80" };

  return (
    <Component {...componentProps}>
      <div className="space-y-4 pr-4">
        {activities.map((activity, index) => {
          const config = ACTION_CONFIG[activity.action] || ACTION_CONFIG.query_created;
          const ActionIcon = config.icon;
          
          return (
            <div key={activity.id || index} className="flex gap-3 group">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                config.color
              )}>
                <ActionIcon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900">
                  <span className="font-medium">{activity.actor_email?.split('@')[0] || 'System'}</span>
                  {' '}
                  <span className="text-slate-600">{config.label.toLowerCase()}</span>
                </p>
                
                {activity.details?.message && (
                  <p className="text-sm text-slate-500 mt-0.5 truncate">
                    {activity.details.message}
                  </p>
                )}
                
                <p className="text-xs text-slate-400 mt-1">
                  {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Component>
  );
}