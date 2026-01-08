import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings as SettingsIcon, Users, Shield, Plug, 
  Activity, UserPlus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import MemberList from '@/components/admin/MemberList';
import IntegrationCard from '@/components/admin/IntegrationCard';
import AuditLogTable from '@/components/admin/AuditLogTable';
import PlanBadge from '@/components/shared/PlanBadge';
import InviteMemberDialog from '@/components/shared/InviteMemberDialog';

export default function Settings() {
  const [currentOrg, setCurrentOrg] = useState(null);
  const [user, setUser] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  
  const queryClient = useQueryClient();

  // Get current user and org
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        const memberships = await base44.entities.Membership.filter({ 
          user_email: userData.email, 
          status: 'active' 
        });
        if (memberships.length > 0) {
          const orgs = await base44.entities.Organization.filter({ id: memberships[0].org_id });
          if (orgs.length > 0) {
            setCurrentOrg(orgs[0]);
            setOrgName(orgs[0].name);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  // Fetch members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.Membership.filter({ org_id: currentOrg.id }) : [],
    enabled: !!currentOrg,
  });

  // Fetch integrations
  const { data: integrations = [], isLoading: integrationsLoading } = useQuery({
    queryKey: ['integrations', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.Integration.filter({ org_id: currentOrg.id }) : [],
    enabled: !!currentOrg,
  });

  // Fetch audit logs
  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ['audit-logs', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.AuditLog.filter({ org_id: currentOrg.id }, '-created_date', 50) : [],
    enabled: !!currentOrg,
  });

  // Update org mutation
  const updateOrgMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Organization.update(currentOrg.id, data);
      
      // Log audit
      await base44.entities.AuditLog.create({
        org_id: currentOrg.id,
        actor_email: user.email,
        action: 'settings_updated',
        action_category: 'admin',
        resource_type: 'Organization',
        resource_id: currentOrg.id,
        status: 'success',
      });
    },
    onSuccess: () => {
      toast.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['org'] });
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      // Create membership
      await base44.entities.Membership.create({
        org_id: currentOrg.id,
        user_email: email,
        role,
        status: 'invited',
        invited_by: user.email,
      });

      // Create approval for admin invites
      if (role === 'admin') {
        await base44.entities.Approval.create({
          org_id: currentOrg.id,
          request_type: 'member_invite',
          requester_email: user.email,
          reason: `Invite ${email} as ${role}`,
          request_data: { email, role },
          status: 'approved', // Auto-approve for now
        });
      }

      // Log audit
      await base44.entities.AuditLog.create({
        org_id: currentOrg.id,
        actor_email: user.email,
        action: 'member_invited',
        action_category: 'admin',
        resource_type: 'Membership',
        details: { email, role },
        status: 'success',
      });

      // Send invite (using platform invite)
      try {
        await base44.users.inviteUser(email, role === 'admin' ? 'admin' : 'user');
      } catch (e) {
        // User might already exist
      }
    },
    onSuccess: () => {
      toast.success('Invitation sent');
      setInviteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: () => {
      toast.error('Failed to send invitation');
    },
  });

  const handleSaveOrg = () => {
    if (!orgName.trim()) return;
    updateOrgMutation.mutate({ name: orgName });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <SettingsIcon className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-500">Manage your workspace settings</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1">
            <TabsTrigger value="general" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Plug className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <Activity className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workspace</CardTitle>
                <CardDescription>Basic workspace settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Workspace Name</Label>
                    <Input
                      id="org-name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="My Workspace"
                    />
                  </div>
                  <Button onClick={handleSaveOrg} disabled={updateOrgMutation.isPending}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan & Billing</CardTitle>
                <CardDescription>Manage your subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">Current Plan</p>
                    <PlanBadge plan={currentOrg?.plan} showFeatures className="mt-2" />
                  </div>
                  <Button variant="outline">Upgrade</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members */}
          <TabsContent value="members" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Team Members</h2>
                <p className="text-sm text-slate-500">{members.length} members</p>
              </div>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>
            
            <MemberList
              members={members}
              currentUserEmail={user?.email}
              loading={membersLoading}
            />
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Integrations</h2>
              <p className="text-sm text-slate-500">Connect external tools and services</p>
            </div>

            {integrations.length === 0 ? (
              <Card className="p-8 text-center">
                <Plug className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">No integrations connected</p>
                <Button>Add Integration</Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="font-medium text-slate-900 mb-2">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-500 mb-3">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="font-medium text-slate-900 mb-2">Session Management</p>
                  <p className="text-sm text-slate-500 mb-3">
                    View and manage active sessions
                  </p>
                  <Button variant="outline">Manage Sessions</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log */}
          <TabsContent value="audit" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Audit Log</h2>
              <p className="text-sm text-slate-500">Track all activity in your workspace</p>
            </div>
            
            <AuditLogTable logs={auditLogs} loading={auditLoading} />
          </TabsContent>
        </Tabs>

        <InviteMemberDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          onInvite={(email, role) => inviteMemberMutation.mutate({ email, role })}
          loading={inviteMemberMutation.isPending}
        />
      </div>
    </div>
  );
}