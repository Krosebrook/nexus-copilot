import React, { useState } from 'react';
import { UserPlus, X, Shield, UserCog, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const ROLE_ICONS = {
  admin: Shield,
  editor: UserCog,
  viewer: Eye,
};

export default function InviteMembersStep({ onNext, onSkip }) {
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');

  const addInvite = () => {
    if (!email.trim() || !email.includes('@')) return;
    if (invites.some(i => i.email === email)) return;
    
    setInvites([...invites, { email, role }]);
    setEmail('');
    setRole('viewer');
  };

  const removeInvite = (emailToRemove) => {
    setInvites(invites.filter(i => i.email !== emailToRemove));
  };

  const handleContinue = () => {
    onNext({ invites });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="h-16 w-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
          <UserPlus className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Invite Your Team</h2>
        <p className="text-slate-600">Collaborate with your team members</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInvite())}
              placeholder="colleague@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="invite-role" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={addInvite}>Add</Button>
          </div>
        </div>

        {invites.length > 0 && (
          <div className="space-y-2 p-4 bg-slate-50 rounded-xl">
            <Label>Invited Members ({invites.length})</Label>
            {invites.map((invite) => {
              const RoleIcon = ROLE_ICONS[invite.role];
              return (
                <div key={invite.email} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <RoleIcon className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{invite.email}</p>
                      <Badge variant="outline" className="text-xs capitalize">{invite.role}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInvite(invite.email)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onSkip} className="flex-1">
          Skip for now
        </Button>
        <Button onClick={handleContinue} className="flex-1" disabled={invites.length === 0}>
          Continue
        </Button>
      </div>
    </div>
  );
}