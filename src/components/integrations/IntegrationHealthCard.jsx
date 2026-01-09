import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle, XCircle, Clock, AlertTriangle,
  RefreshCw, Plug, Settings, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const INTEGRATION_ICONS = {
  slack: '💬',
  notion: '📝',
  confluence: '🌐',
  github: '🐙',
  jira: '📊',
  linear: '📈',
  custom_webhook: '🔗',
};

const STATUS_CONFIG = {
  active: {
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Active',
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Error',
  },
  pending_auth: {
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Pending Auth',
  },
  inactive: {
    icon: AlertTriangle,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    label: 'Inactive',
  },
};

export default function IntegrationHealthCard({ 
  integration, 
  health,
  onSync, 
  onReconnect, 
  onRemove,
  isSyncing = false 
}) {
  const [showDetails, setShowDetails] = useState(false);
  const statusConfig = STATUS_CONFIG[integration.status] || STATUS_CONFIG.inactive;
  const StatusIcon = statusConfig.icon;
  const hasIssues = health && !health.healthy;
  const hasCriticalIssues = health?.issues?.some(i => i.severity === 'critical');

  return (
    <Card className={cn(
      "border-2", 
      hasCriticalIssues ? "border-red-300 bg-red-50/30" : 
      hasIssues ? "border-amber-300 bg-amber-50/30" : 
      statusConfig.border
    )}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center text-2xl relative",
            hasCriticalIssues ? "bg-red-100" : hasIssues ? "bg-amber-100" : "bg-slate-100"
          )}>
            {INTEGRATION_ICONS[integration.type] || <Plug className="h-6 w-6 text-slate-400" />}
            {hasCriticalIssues && (
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white" />
            )}
            {hasIssues && !hasCriticalIssues && (
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-amber-500 rounded-full border-2 border-white" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-slate-900">{integration.name}</h3>
                <p className="text-sm text-slate-500 capitalize">{integration.type.replace('_', ' ')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-xs", statusConfig.bg, statusConfig.border)}>
                  <StatusIcon className={cn("h-3 w-3 mr-1", statusConfig.color)} />
                  {statusConfig.label}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onSync} disabled={isSyncing}>
                      <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
                      Sync Now
                    </DropdownMenuItem>
                    {integration.status === 'error' && (
                      <DropdownMenuItem onClick={onReconnect}>
                        <Plug className="h-4 w-4 mr-2" />
                        Reconnect
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onRemove} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Health Issues */}
            {hasIssues && (
              <div className="mb-3 space-y-2">
                {health.issues.map((issue, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "p-3 rounded-lg border",
                      issue.severity === 'critical' 
                        ? "bg-red-50 border-red-200" 
                        : "bg-amber-50 border-amber-200"
                    )}
                  >
                    <p className={cn(
                      "text-sm flex items-start gap-2",
                      issue.severity === 'critical' ? "text-red-700" : "text-amber-700"
                    )}>
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="font-medium">
                          {issue.severity === 'critical' ? 'Critical: ' : 'Warning: '}
                        </span>
                        {issue.message}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Error Message (if not covered by health issues) */}
            {integration.error_message && !hasIssues && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{integration.error_message}</span>
                </p>
              </div>
            )}

            {/* Health Score */}
            {health && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Health Score</span>
                  <span className={cn(
                    "text-xs font-medium",
                    health.score >= 75 ? "text-green-600" :
                    health.score >= 50 ? "text-amber-600" :
                    "text-red-600"
                  )}>
                    {health.score}/100
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-300",
                      health.score >= 75 ? "bg-green-500" :
                      health.score >= 50 ? "bg-amber-500" :
                      "bg-red-500"
                    )}
                    style={{ width: `${health.score}%` }}
                  />
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
              {integration.last_sync_at && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-xs">
                    Last sync: {format(new Date(integration.last_sync_at), 'MMM d, h:mm a')}
                  </span>
                </div>
              )}
              {integration.sync_count !== undefined && (
                <div className="flex items-center gap-1">
                  <RefreshCw className="h-4 w-4 text-slate-400" />
                  <span className="text-xs">{integration.sync_count} syncs</span>
                </div>
              )}
              {integration.capabilities && integration.capabilities.length > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-slate-400" />
                  <span className="text-xs">{integration.capabilities.length} capabilities</span>
                </div>
              )}
            </div>

            {/* Capabilities */}
            {integration.capabilities && integration.capabilities.length > 0 && (
              <div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2"
                >
                  {showDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {showDetails ? 'Hide' : 'Show'} capabilities
                </button>
                
                {showDetails && (
                  <div className="flex flex-wrap gap-1.5 pl-5">
                    {integration.capabilities.map((cap, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {cap.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}