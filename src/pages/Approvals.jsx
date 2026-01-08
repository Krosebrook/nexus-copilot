import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import ApprovalCard from '@/components/admin/ApprovalCard';

export default function Approvals() {
  const [currentOrg, setCurrentOrg] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [decisionDialog, setDecisionDialog] = useState({ open: false, approval: null, action: null });
  const [decisionReason, setDecisionReason] = useState('');
  
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
          setUserRole(memberships[0].role);
          const orgs = await base44.entities.Organization.filter({ id: memberships[0].org_id });
          if (orgs.length > 0) setCurrentOrg(orgs[0]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  // Fetch approvals
  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['approvals', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.Approval.filter({ org_id: currentOrg.id }, '-created_date', 50) : [],
    enabled: !!currentOrg,
  });

  // Decision mutation
  const decisionMutation = useMutation({
    mutationFn: async ({ approval, action, reason }) => {
      await base44.entities.Approval.update(approval.id, {
        status: action,
        decision_reason: reason,
        decided_at: new Date().toISOString(),
        approver_email: user.email,
      });

      // Log audit
      await base44.entities.AuditLog.create({
        org_id: currentOrg.id,
        actor_email: user.email,
        action: 'approval_decided',
        action_category: 'admin',
        resource_type: 'Approval',
        resource_id: approval.id,
        details: { decision: action, reason },
        status: 'success',
      });
    },
    onSuccess: () => {
      toast.success('Decision recorded');
      setDecisionDialog({ open: false, approval: null, action: null });
      setDecisionReason('');
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
    onError: () => {
      toast.error('Failed to record decision');
    },
  });

  const handleApprove = (approval) => {
    setDecisionDialog({ open: true, approval, action: 'approved' });
  };

  const handleReject = (approval) => {
    setDecisionDialog({ open: true, approval, action: 'rejected' });
  };

  const submitDecision = () => {
    if (!decisionDialog.approval || !decisionDialog.action) return;
    decisionMutation.mutate({
      approval: decisionDialog.approval,
      action: decisionDialog.action,
      reason: decisionReason,
    });
  };

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const decidedApprovals = approvals.filter(a => a.status !== 'pending');

  const canDecide = userRole === 'owner' || userRole === 'admin';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Approvals</h1>
            <p className="text-sm text-slate-500">Review and manage approval requests</p>
          </div>
          {pendingApprovals.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingApprovals.length} pending
            </Badge>
          )}
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending
              {pendingApprovals.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingApprovals.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="decided" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Decided
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-3" />
                <p className="text-slate-500">No pending approvals</p>
                <p className="text-sm text-slate-400 mt-1">All caught up!</p>
              </div>
            ) : (
              pendingApprovals.map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  canDecide={canDecide}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="decided" className="space-y-4">
            {decidedApprovals.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No decisions yet</p>
              </div>
            ) : (
              decidedApprovals.map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  canDecide={false}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Decision Dialog */}
        <Dialog open={decisionDialog.open} onOpenChange={(open) => !open && setDecisionDialog({ open: false, approval: null, action: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {decisionDialog.action === 'approved' ? 'Approve Request' : 'Reject Request'}
              </DialogTitle>
              <DialogDescription>
                {decisionDialog.action === 'approved' 
                  ? 'This action will be executed immediately.'
                  : 'The requester will be notified of the rejection.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Textarea
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder={decisionDialog.action === 'approved' 
                    ? 'Add a note for the audit log...' 
                    : 'Explain why this request is being rejected...'}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDecisionDialog({ open: false, approval: null, action: null })}>
                Cancel
              </Button>
              <Button
                onClick={submitDecision}
                disabled={decisionMutation.isPending}
                className={decisionDialog.action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {decisionDialog.action === 'approved' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}