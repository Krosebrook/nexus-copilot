import React from 'react';
import { format } from 'date-fns';
import { Zap, Play, Pause } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function WorkflowList({ workflows, selectedId, onSelect, onToggle }) {
  return (
    <div className="p-4 space-y-2">
      {workflows.map((workflow) => (
        <div
          key={workflow.id}
          onClick={() => onSelect(workflow)}
          className={cn(
            "p-4 rounded-lg border cursor-pointer transition-all",
            selectedId === workflow.id 
              ? "bg-slate-100 border-slate-300" 
              : "bg-white border-slate-200 hover:bg-slate-50"
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">{workflow.name}</h3>
              <p className="text-xs text-slate-500 capitalize">{workflow.trigger_type.replace('_', ' ')}</p>
            </div>
            <Switch
              checked={workflow.is_active}
              onCheckedChange={() => onToggle(workflow)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{workflow.steps?.length || 0} steps</span>
            <span>•</span>
            <span>{workflow.execution_count || 0} runs</span>
          </div>
        </div>
      ))}
    </div>
  );
}