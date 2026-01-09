import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Workflow, Plus, Play, Pause } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import WorkflowList from '@/components/workflow/WorkflowList';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import WorkflowSidebar from '@/components/workflow/WorkflowSidebar';
import TriggerConfigDialog from '@/components/workflow/TriggerConfigDialog';
import PermissionGuard from '@/components/rbac/PermissionGuard';

export default function WorkflowBuilder() {
  const [currentOrg, setCurrentOrg] = useState(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showTriggerDialog, setShowTriggerDialog] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const user = await base44.auth.me();
        const memberships = await base44.entities.Membership.filter({ 
          user_email: user.email, 
          status: 'active' 
        });
        if (memberships.length > 0) {
          const orgs = await base44.entities.Organization.filter({ id: memberships[0].org_id });
          if (orgs.length > 0) setCurrentOrg(orgs[0]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchOrg();
  }, []);

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.Workflow.filter({ org_id: currentOrg.id }, '-updated_date') : [],
    enabled: !!currentOrg,
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async () => {
      const workflow = await base44.entities.Workflow.create({
        org_id: currentOrg.id,
        name: 'New Workflow',
        trigger_type: 'manual',
        trigger_config: {},
        steps: [],
        is_active: false,
      });
      return workflow;
    },
    onSuccess: (workflow) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setSelectedWorkflow(workflow);
      setIsEditing(true);
      toast.success('Workflow created');
    },
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ workflowId, updates }) => {
      await base44.entities.Workflow.update(workflowId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow saved');
    },
  });

  const toggleWorkflowMutation = useMutation({
    mutationFn: async (workflow) => {
      await base44.entities.Workflow.update(workflow.id, {
        is_active: !workflow.is_active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const updateTriggerMutation = useMutation({
    mutationFn: async ({ trigger_type, trigger_config }) => {
      await base44.entities.Workflow.update(selectedWorkflow.id, {
        trigger_type,
        trigger_config,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Trigger updated');
    },
  });

  return (
    <PermissionGuard permission={['manage_integrations', 'admin']} requireAny fallback={
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Workflow className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">You don't have permission to access workflow automation</p>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-slate-50">
        <div className="flex h-screen">
          {/* Workflow List Sidebar */}
          <div className="w-80 bg-white border-r border-slate-200 overflow-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold text-slate-900">Workflows</h1>
                <Button
                  size="sm"
                  onClick={() => createWorkflowMutation.mutate()}
                  disabled={createWorkflowMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </div>
            </div>
            <WorkflowList
              workflows={workflows}
              selectedId={selectedWorkflow?.id}
              onSelect={(workflow) => {
                setSelectedWorkflow(workflow);
                setIsEditing(false);
              }}
              onToggle={(workflow) => toggleWorkflowMutation.mutate(workflow)}
            />
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex flex-col">
            {selectedWorkflow ? (
              <>
                <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{selectedWorkflow.name}</h2>
                    <p className="text-sm text-slate-500 capitalize">
                      {selectedWorkflow.trigger_type.replace('_', ' ')} trigger • 
                      {selectedWorkflow.is_active ? 'Active' : 'Inactive'} • 
                      {selectedWorkflow.execution_count || 0} runs
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setShowTriggerDialog(true)}>
                      Configure Trigger
                    </Button>
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)}>Edit Workflow</Button>
                    ) : (
                      <Button onClick={() => {
                        updateWorkflowMutation.mutate({
                          workflowId: selectedWorkflow.id,
                          updates: selectedWorkflow,
                        });
                        setIsEditing(false);
                      }}>
                        Save Changes
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex-1 flex">
                  <WorkflowCanvas
                    workflow={selectedWorkflow}
                    isEditing={isEditing}
                    onUpdate={(updates) => setSelectedWorkflow({ ...selectedWorkflow, ...updates })}
                  />
                  {isEditing && (
                    <WorkflowSidebar workflow={selectedWorkflow} />
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Workflow className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">Select a workflow or create a new one</p>
                  <Button onClick={() => createWorkflowMutation.mutate()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workflow
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trigger Config Dialog */}
        {selectedWorkflow && (
          <TriggerConfigDialog
            open={showTriggerDialog}
            onOpenChange={setShowTriggerDialog}
            workflow={selectedWorkflow}
            onSave={(triggerConfig) => {
              updateTriggerMutation.mutate(triggerConfig);
              setSelectedWorkflow({ ...selectedWorkflow, ...triggerConfig });
            }}
          />
        )}
      </div>
    </PermissionGuard>
  );
}