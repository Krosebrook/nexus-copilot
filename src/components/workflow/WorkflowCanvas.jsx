import React from 'react';
import { Plus, ArrowDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import WorkflowStepCard from './WorkflowStepCard';

export default function WorkflowCanvas({ workflow, isEditing, onUpdate }) {
  const addStep = (stepType = 'send_notification') => {
    const newStep = {
      id: `step_${Date.now()}`,
      type: 'action',
      config: { action: stepType },
    };
    
    onUpdate({
      steps: [...(workflow.steps || []), newStep],
    });
  };

  const updateStep = (stepId, updates) => {
    onUpdate({
      steps: workflow.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      ),
    });
  };

  const removeStep = (stepId) => {
    onUpdate({
      steps: workflow.steps.filter(step => step.id !== stepId),
    });
  };

  return (
    <div className="flex-1 overflow-auto p-8 bg-slate-50">
      <div className="max-w-2xl mx-auto">
        {/* Trigger */}
        <div className="mb-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-900">
              <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                T
              </div>
              <div>
                <p className="font-medium">Trigger</p>
                <p className="text-sm text-blue-700 capitalize">{workflow.trigger_type.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        {workflow.steps?.map((step, idx) => (
          <div key={step.id}>
            <div className="flex justify-center mb-4">
              <ArrowDown className="h-6 w-6 text-slate-400" />
            </div>
            <div className="mb-6">
              <WorkflowStepCard
                step={step}
                index={idx}
                isEditing={isEditing}
                onUpdate={(updates) => updateStep(step.id, updates)}
                onRemove={() => removeStep(step.id)}
              />
            </div>
          </div>
        ))}

        {/* Add Step */}
        {isEditing && (
          <>
            {workflow.steps?.length > 0 && (
              <div className="flex justify-center mb-4">
                <ArrowDown className="h-6 w-6 text-slate-400" />
              </div>
            )}
            <Button
              variant="outline"
              onClick={addStep}
              className="w-full border-dashed border-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </>
        )}
      </div>
    </div>
  );
}