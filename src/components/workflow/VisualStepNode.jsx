import React from 'react';
import { Zap, GitBranch, Repeat, Layers, Trash2, AlertCircle, RefreshCcw, GripVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STEP_ICONS = {
  action: Zap,
  condition: GitBranch,
  loop: Repeat,
  parallel: Layers,
};

const STEP_COLORS = {
  action: 'bg-white border-slate-200',
  condition: 'bg-purple-50 border-purple-200',
  loop: 'bg-green-50 border-green-200',
  parallel: 'bg-blue-50 border-blue-200',
};

const ICON_COLORS = {
  action: 'bg-slate-100 text-slate-600',
  condition: 'bg-purple-500 text-white',
  loop: 'bg-green-500 text-white',
  parallel: 'bg-blue-500 text-white',
};

export default function VisualStepNode({ 
  step, 
  index, 
  isEditing, 
  isSelected,
  onClick, 
  onRemove 
}) {
  const Icon = STEP_ICONS[step.type] || Zap;
  const hasErrorHandling = step.error_config?.retry_enabled || step.error_config?.continue_on_error;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-xl border-2 transition-all duration-200",
        STEP_COLORS[step.type] || 'bg-white border-slate-200',
        isEditing && "cursor-pointer hover:shadow-md",
        isSelected && "ring-2 ring-blue-500 shadow-lg",
      )}
    >
      {/* Drag Handle */}
      {isEditing && (
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-5 w-5 text-slate-400" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center",
              ICON_COLORS[step.type] || 'bg-slate-100 text-slate-600'
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-slate-900">
                {step.config?.label || `Step ${index + 1}`}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {step.type} {step.config?.action && `• ${step.config.action.replace('_', ' ')}`}
              </p>
            </div>
          </div>

          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Step Details */}
        <div className="space-y-2 text-sm text-slate-600">
          {step.config?.recipient && (
            <p className="text-xs">To: {step.config.recipient}</p>
          )}
          {step.config?.url && (
            <p className="text-xs truncate">URL: {step.config.url}</p>
          )}
          {step.config?.condition && (
            <p className="text-xs">If: {step.config.condition}</p>
          )}
          {step.config?.loop_source && (
            <p className="text-xs">Loop: {step.config.loop_source}</p>
          )}
          {step.config?.parallel_branches && (
            <p className="text-xs">{step.config.parallel_branches.length} parallel branches</p>
          )}
          {step.config?.data_mapping && Object.keys(step.config.data_mapping).length > 0 && (
            <div className="text-xs">
              <p className="font-medium text-slate-700 mb-1">Data Mapping:</p>
              {Object.entries(step.config.data_mapping).slice(0, 2).map(([key, value]) => (
                <p key={key} className="text-slate-500">
                  {key} ← {value}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Error Handling Badges */}
        {hasErrorHandling && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-200">
            {step.error_config?.retry_enabled && (
              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                <RefreshCcw className="h-3 w-3 mr-1" />
                Retry {step.error_config.retry_count}x
              </Badge>
            )}
            {step.error_config?.continue_on_error && (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Continue on error
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-blue-500 border-2 border-white"></div>
      )}
    </div>
  );
}