import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Zap, ArrowRight, GitBranch, Repeat, Layers } from 'lucide-react';
import { Button } from "@/components/ui/button";
import VisualStepNode from './VisualStepNode';
import StepConfigPanel from './StepConfigPanel';

export default function VisualWorkflowCanvas({ workflow, isEditing, onUpdate }) {
  const [selectedStep, setSelectedStep] = useState(null);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  const canvasRef = useRef(null);

  const addStep = (stepType = 'action', insertAfterIndex = -1) => {
    const newStep = {
      id: `step_${Date.now()}`,
      type: stepType,
      config: { 
        action: stepType === 'action' ? 'send_notification' : undefined,
        label: stepType === 'loop' ? 'Loop through items' : 
               stepType === 'parallel' ? 'Run in parallel' :
               stepType === 'condition' ? 'If condition' : 'New action'
      },
      error_config: {
        retry_enabled: false,
        retry_count: 3,
        retry_delay_seconds: 60,
        continue_on_error: false,
      },
      position: { 
        x: 100, 
        y: 100 + ((workflow.steps?.length || 0) * 120) 
      },
    };
    
    const currentSteps = workflow.steps || [];
    const updatedSteps = insertAfterIndex >= 0
      ? [
          ...currentSteps.slice(0, insertAfterIndex + 1),
          newStep,
          ...currentSteps.slice(insertAfterIndex + 1)
        ]
      : [...currentSteps, newStep];

    onUpdate({ steps: updatedSteps });
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
    if (selectedStep?.id === stepId) {
      setSelectedStep(null);
      setConfigPanelOpen(false);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(workflow.steps || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onUpdate({ steps: items });
  };

  const handleStepClick = (step) => {
    if (isEditing) {
      setSelectedStep(step);
      setConfigPanelOpen(true);
    }
  };

  const renderStepIcon = (step) => {
    switch (step.type) {
      case 'condition':
        return <GitBranch className="h-4 w-4" />;
      case 'loop':
        return <Repeat className="h-4 w-4" />;
      case 'parallel':
        return <Layers className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 flex" ref={canvasRef}>
      {/* Main Canvas */}
      <div className="flex-1 overflow-auto bg-slate-50 p-8">
        <div className="max-w-3xl mx-auto">
          {/* Trigger */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3 text-white">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Trigger</p>
                  <p className="text-sm text-blue-100 capitalize">
                    {workflow.trigger_type?.replace('_', ' ') || 'Manual'}
                  </p>
                  {workflow.trigger_config?.entity_name && (
                    <p className="text-xs text-blue-200 mt-0.5">
                      Entity: {workflow.trigger_config.entity_name} • 
                      {workflow.trigger_config.event_types?.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Steps */}
          {isEditing ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="workflow-steps">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {workflow.steps?.map((step, idx) => (
                      <React.Fragment key={step.id}>
                        <Draggable draggableId={step.id} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <VisualStepNode
                                step={step}
                                index={idx}
                                isEditing={isEditing}
                                isSelected={selectedStep?.id === step.id}
                                onClick={() => handleStepClick(step)}
                                onRemove={() => removeStep(step.id)}
                              />
                            </div>
                          )}
                        </Draggable>
                        
                        {/* Connection Arrow */}
                        {idx < workflow.steps.length - 1 && (
                          <div className="flex justify-center py-2">
                            <ArrowRight className="h-5 w-5 text-slate-400 rotate-90" />
                          </div>
                        )}

                        {/* Add Step Between */}
                        {isEditing && (
                          <div className="flex justify-center -my-2 relative z-10">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addStep('action', idx)}
                              className="bg-white border border-dashed border-slate-300 hover:border-slate-400 h-8 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Step
                            </Button>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="space-y-4">
              {workflow.steps?.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <VisualStepNode
                    step={step}
                    index={idx}
                    isEditing={false}
                    onClick={() => handleStepClick(step)}
                  />
                  {idx < workflow.steps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowRight className="h-5 w-5 text-slate-400 rotate-90" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Add First Step */}
          {isEditing && (!workflow.steps || workflow.steps.length === 0) && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => addStep('action')}
                className="h-24 border-dashed border-2 flex-col gap-2"
              >
                <Zap className="h-6 w-6 text-slate-500" />
                <span>Add Action</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => addStep('condition')}
                className="h-24 border-dashed border-2 flex-col gap-2"
              >
                <GitBranch className="h-6 w-6 text-purple-500" />
                <span>Add Condition</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => addStep('loop')}
                className="h-24 border-dashed border-2 flex-col gap-2"
              >
                <Repeat className="h-6 w-6 text-green-500" />
                <span>Add Loop</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => addStep('parallel')}
                className="h-24 border-dashed border-2 flex-col gap-2"
              >
                <Layers className="h-6 w-6 text-blue-500" />
                <span>Run Parallel</span>
              </Button>
            </div>
          )}

          {/* Add Step at End */}
          {isEditing && workflow.steps?.length > 0 && (
            <>
              <div className="flex justify-center py-2">
                <ArrowRight className="h-5 w-5 text-slate-400 rotate-90" />
              </div>
              <Button
                variant="outline"
                onClick={() => addStep('action')}
                className="w-full border-dashed border-2 h-16"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Config Panel */}
      {configPanelOpen && selectedStep && (
        <StepConfigPanel
          step={selectedStep}
          workflow={workflow}
          onUpdate={(updates) => {
            updateStep(selectedStep.id, updates);
            setSelectedStep({ ...selectedStep, ...updates });
          }}
          onClose={() => {
            setConfigPanelOpen(false);
            setSelectedStep(null);
          }}
        />
      )}
    </div>
  );
}