import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Workflow, ArrowRight, AlertCircle } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function SubWorkflowStep({ config = {}, onChange, orgId }) {
  const [selectedWorkflow, setSelectedWorkflow] = useState(config.sub_workflow_id || '');
  const [dataMapping, setDataMapping] = useState(config.data_mapping || '');
  const [waitForCompletion, setWaitForCompletion] = useState(config.wait_for_completion !== false);
  const [continueOnError, setContinueOnError] = useState(config.continue_on_error || false);

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows', orgId],
    queryFn: () => base44.entities.Workflow.filter({ org_id: orgId, is_active: true }),
    enabled: !!orgId,
  });

  const handleWorkflowChange = (workflowId) => {
    setSelectedWorkflow(workflowId);
    onChange?.({
      sub_workflow_id: workflowId,
      data_mapping: dataMapping,
      wait_for_completion: waitForCompletion,
      continue_on_error: continueOnError,
    });
  };

  const handleDataMappingChange = (mapping) => {
    setDataMapping(mapping);
    onChange?.({
      sub_workflow_id: selectedWorkflow,
      data_mapping: mapping,
      wait_for_completion: waitForCompletion,
      continue_on_error: continueOnError,
    });
  };

  const handleWaitChange = (checked) => {
    setWaitForCompletion(checked);
    onChange?.({
      sub_workflow_id: selectedWorkflow,
      data_mapping: dataMapping,
      wait_for_completion: checked,
      continue_on_error: continueOnError,
    });
  };

  const handleErrorHandlingChange = (checked) => {
    setContinueOnError(checked);
    onChange?.({
      sub_workflow_id: selectedWorkflow,
      data_mapping: dataMapping,
      wait_for_completion: waitForCompletion,
      continue_on_error: checked,
    });
  };

  const selectedWorkflowData = workflows.find(w => w.id === selectedWorkflow);

  return (
    <div className="space-y-4">
      <div>
        <Label>Select Workflow to Trigger</Label>
        <Select value={selectedWorkflow} onValueChange={handleWorkflowChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a workflow" />
          </SelectTrigger>
          <SelectContent>
            {workflows.map((workflow) => (
              <SelectItem key={workflow.id} value={workflow.id}>
                <div className="flex items-center gap-2">
                  <Workflow className="h-4 w-4" />
                  {workflow.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedWorkflowData && (
          <div className="mt-2 p-2 bg-slate-50 rounded text-xs space-y-1">
            <p className="text-slate-600">
              <strong>Trigger:</strong> {selectedWorkflowData.trigger_type}
            </p>
            <p className="text-slate-500">
              {selectedWorkflowData.description || 'No description'}
            </p>
          </div>
        )}
      </div>

      <div>
        <Label>Data Mapping (JSON)</Label>
        <Textarea
          value={dataMapping}
          onChange={(e) => handleDataMappingChange(e.target.value)}
          placeholder={'{\n  "field1": "{{trigger.data.value}}",\n  "field2": "{{step_1.result}}"\n}'}
          rows={6}
          className="text-sm font-mono"
        />
        <p className="text-xs text-slate-500 mt-1">
          Map data from current workflow to sub-workflow trigger. Use {'{{variable}}'} syntax.
        </p>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
        <div>
          <Label className="text-sm font-medium">Wait for Completion</Label>
          <p className="text-xs text-slate-500">
            Block execution until sub-workflow completes
          </p>
        </div>
        <Switch
          checked={waitForCompletion}
          onCheckedChange={handleWaitChange}
        />
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
        <div>
          <Label className="text-sm font-medium">Continue on Error</Label>
          <p className="text-xs text-slate-500">
            Continue parent workflow if sub-workflow fails
          </p>
        </div>
        <Switch
          checked={continueOnError}
          onCheckedChange={handleErrorHandlingChange}
        />
      </div>

      {selectedWorkflow && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Sub-workflow behavior:</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                <li>Sub-workflow receives mapped data as trigger payload</li>
                <li>Execution status and results are returned to parent</li>
                <li>Parent can access sub-workflow results via {'{{step_N.sub_workflow}}'}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}