import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  User, MoreHorizontal, Shield, Edit, Trash2, 
  Mail, Crown, UserCog, Eye
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ROLE_CONFIG = {
  owner: { label: 'Owner', icon: Crown, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  editor: { label: 'Editor', icon: UserCog, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  viewer: { label: 'Viewer', icon: Eye, color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-50 text-green-700' },
  invited: { label: 'Invited', color: 'bg-amber-50 text-amber-700' },
  suspended: { label: 'Suspended', color: 'bg-red-50 text-red-700' },
};

export default function MemberList({ 
  members = [], 
  currentUserEmail,
  onRoleChange,
  onRemove,
  onResendInvite,
  loading = false 
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-2xl">
        <User className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No members yet</p>
        <p className="text-sm text-slate-400">Invite team members to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer;
        const statusConfig = STATUS_CONFIG[member.status] || STATUS_CONFIG.active;
        const RoleIcon = roleConfig.icon;
        const isCurrentUser = member.user_email === currentUserEmail;
        const initials = member.user_email?.split('@')[0]?.slice(0, 2).toUpperCase() || 'U';

        return (
          <div 
            key={member.id}
            className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-all"
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-slate-100 text-slate-600 text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {member.user_email}
                </p>
                {isCurrentUser && (
                  <Badge variant="outline" className="text-[10px] bg-slate-50">You</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-xs", roleConfig.color)}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {roleConfig.label}
                </Badge>
                <Badge variant="secondary" className={cn("text-xs", statusConfig.color)}>
                  {statusConfig.label}
                </Badge>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">
                {member.accepted_at ? 'Joined' : 'Invited'}
              </p>
              <p className="text-xs text-slate-500">
                {format(new Date(member.accepted_at || member.created_date), 'MMM d, yyyy')}
              </p>
            </div>

            {!isCurrentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onRoleChange?.(member)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Change Role
                  </DropdownMenuItem>
                  {member.status === 'invited' && (
                    <DropdownMenuItem onClick={() => onResendInvite?.(member)}>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Invite
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onRemove?.(member)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      })}
    </div>
  );
}