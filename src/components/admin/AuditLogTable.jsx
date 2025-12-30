import React from 'react';
import { format } from 'date-fns';
import { 
  Shield, User, Database, Plug, Settings, AlertCircle,
  CheckCircle, XCircle, Clock
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS = {
  auth: Shield,
  query: Database,
  admin: Settings,
  data: Database,
  integration: Plug,
  system: Settings,
};

const CATEGORY_COLORS = {
  auth: 'bg-purple-50 text-purple-700 border-purple-200',
  query: 'bg-blue-50 text-blue-700 border-blue-200',
  admin: 'bg-amber-50 text-amber-700 border-amber-200',
  data: 'bg-green-50 text-green-700 border-green-200',
  integration: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  system: 'bg-slate-50 text-slate-700 border-slate-200',
};

const STATUS_CONFIG = {
  success: { icon: CheckCircle, color: 'text-green-500' },
  failure: { icon: XCircle, color: 'text-red-500' },
  pending: { icon: Clock, color: 'text-amber-500' },
};

export default function AuditLogTable({ logs = [], loading = false }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-2xl">
        <Shield className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No audit logs yet</p>
        <p className="text-sm text-slate-400">Activity will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="text-xs font-medium text-slate-500">Timestamp</TableHead>
            <TableHead className="text-xs font-medium text-slate-500">Actor</TableHead>
            <TableHead className="text-xs font-medium text-slate-500">Action</TableHead>
            <TableHead className="text-xs font-medium text-slate-500">Category</TableHead>
            <TableHead className="text-xs font-medium text-slate-500">Status</TableHead>
            <TableHead className="text-xs font-medium text-slate-500">Resource</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const CategoryIcon = CATEGORY_ICONS[log.action_category] || Settings;
            const statusConfig = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            
            return (
              <TableRow key={log.id} className="hover:bg-slate-50">
                <TableCell className="text-sm text-slate-600">
                  <div>
                    <p>{format(new Date(log.created_date), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-slate-400">{format(new Date(log.created_date), 'h:mm:ss a')}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <span className="text-sm text-slate-700 truncate max-w-[150px]">
                      {log.actor_email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm text-slate-700">
                  {log.action}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", CATEGORY_COLORS[log.action_category])}
                  >
                    <CategoryIcon className="h-3 w-3 mr-1" />
                    {log.action_category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {log.resource_type && (
                    <span className="font-mono text-xs">
                      {log.resource_type}:{log.resource_id?.slice(0, 8)}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}