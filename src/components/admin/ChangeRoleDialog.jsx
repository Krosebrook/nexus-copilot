import React, { useState } from 'react';
import { Shield, Crown, UserCog, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const ROLES = [
  { 
    value: 'admin', 
    label: 'Admin', 
    icon: Shield, 
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Full access to manage workflows, knowledge base, members, and settings',
    permissions: [
      'Manage workflows & knowledge',
      'Manage integrations',
      'View audit logs',
      'Manage members',
      'Approve requests'
    ]
  },
  { 
    value: 'editor', 
    label: 'Editor', 
    icon: UserCog, 
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Can create and edit workflows and knowledge articles',
    permissions: [
      'Create & edit workflows',
      'Create & edit knowledge',
      'Use Copilot',
      'View analytics'
    ]
  },
  { 
    value: 'viewer', 
    label: 'Viewer', 
    icon: Eye, 
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    description: 'Read-only access to Copilot and analytics',
    permissions: [
      'Use Copilot',
      'View analytics',
      'View workflows & knowledge'
    ]
  },
];

export default function ChangeRoleDialog({ open, onOpenChange, member, onConfirm }) {
  const [selectedRole, setSelectedRole] = useState(member?.role || 'viewer');
  
  const currentRoleConfig = ROLES.find(r => r.value === selectedRole);
  const Icon = currentRoleConfig?.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Update {member?.user_email}'s role and permissions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label>Select Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => {
                  const RoleIcon = role.icon;
                  return (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <RoleIcon className="h-4 w-4" />
                        {role.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {currentRoleConfig && (
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2 mb-2">
                {Icon && <Icon className="h-5 w-5 text-slate-600" />}
                <h4 className="font-medium text-slate-900">{currentRoleConfig.label}</h4>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                {currentRoleConfig.description}
              </p>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700 mb-2">Permissions:</p>
                {currentRoleConfig.permissions.map((perm) => (
                  <Badge key={perm} variant="outline" className="text-xs mr-2">
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(selectedRole)}>
            Update Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}