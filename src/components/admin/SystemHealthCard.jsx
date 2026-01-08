import React from 'react';
import { 
  CheckCircle, AlertTriangle, XCircle, Server, Zap, Clock
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const STATUS_CONFIG = {
  healthy: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Healthy' },
  degraded: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Degraded' },
  down: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Down' },
};

export default function SystemHealthCard({ 
  service,
  status = 'healthy',
  latency,
  uptime,
  details,
  icon: Icon = Server
}) {
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.healthy;
  const StatusIcon = statusConfig.icon;

  return (
    <div className={cn(
      "bg-white border border-slate-200 rounded-2xl p-5 transition-all hover:shadow-sm",
      status === 'down' && "border-red-200"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center",
            statusConfig.bg
          )}>
            <Icon className={cn("h-5 w-5", statusConfig.color)} />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">{service}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <StatusIcon className={cn("h-3.5 w-3.5", statusConfig.color)} />
              <span className={cn("text-xs font-medium", statusConfig.color)}>
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {latency !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Latency
            </span>
            <span className="text-sm font-medium text-slate-700">{latency}ms</span>
          </div>
        )}

        {uptime !== undefined && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Uptime (30d)
              </span>
              <span className="text-sm font-medium text-slate-700">{uptime}%</span>
            </div>
            <Progress value={uptime} className="h-1.5" />
          </div>
        )}

        {details && (
          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            {details}
          </p>
        )}
      </div>
    </div>
  );
}