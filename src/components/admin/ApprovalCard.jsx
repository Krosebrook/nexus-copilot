import React from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle, XCircle, Clock, User, 
  UserPlus, Download, Trash2, Link, ArrowUpCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TYPE_CONFIG = {
  role_change: { icon: User, label: 'Role Change', color: 'bg-purple-50 text-purple-700' },
  data_export: { icon: Download, label: 'Data Export', color: 'bg-blue-50 text-blue-700' },
  data_deletion: { icon: Trash2, label: 'Data Deletion', color: 'bg-red-50 text-red-700' },
  integration_connect: { icon: Link, label: 'Integration', color: 'bg-cyan-50 text-cyan-700' },
  plan_upgrade: { icon: ArrowUpCircle, label: 'Plan Upgrade', color: 'bg-amber-50 text-amber-700' },
  member_invite: { icon: UserPlus, label: 'Member Invite', color: 'bg-green-50 text-green-700' },
};

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  approved: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
  rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  expired: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50' },
};

export default function ApprovalCard({ 
  approval, 
  onApprove, 
  onReject,
  canDecide = false 
}) {
  const typeConfig = TYPE_CONFIG[approval.request_type] || TYPE_CONFIG.role_change;
  const statusConfig = STATUS_CONFIG[approval.status] || STATUS_CONFIG.pending;
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
          typeConfig.color
        )}>
          <TypeIcon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-slate-900">{typeConfig.label}</h3>
            <Badge variant="outline" className={cn("text-xs", statusConfig.bg, statusConfig.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {approval.status}
            </Badge>
          </div>

          <p className="text-sm text-slate-600 mb-2">
            {approval.reason || 'No reason provided'}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>
              Requested by <span className="font-medium text-slate-700">{approval.requester_email}</span>
            </span>
            <span>
              {format(new Date(approval.created_date), 'MMM d, yyyy h:mm a')}
            </span>
          </div>

          {approval.decision_reason && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Decision reason:</p>
              <p className="text-sm text-slate-700">{approval.decision_reason}</p>
            </div>
          )}
        </div>

        {canDecide && approval.status === 'pending' && (
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject?.(approval)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={() => onApprove?.(approval)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}