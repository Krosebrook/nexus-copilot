import React from 'react';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Loader2, Bot, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ExecutionStepResult from './ExecutionStepResult';

const STATUS_CONFIG = {
  running: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Running', spin: true },
  completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Failed' },
  cancelled: { icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-50', label: 'Cancelled' },
};

export default function ExecutionCard({ execution, isExpanded, onToggle }) {
  const config = STATUS_CONFIG[execution.status] || STATUS_CONFIG.running;
  const Icon = config.icon;
  
  const hasAgentSteps = execution.step_results?.some(
    step => step.step_type === 'ai_agent' || step.config?.action === 'ai_agent'
  );

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className={`p-3 rounded-lg border ${config.bg} border-slate-200`}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${config.color} ${config.spin ? 'animate-spin' : ''}`} />
              <Badge variant="outline" className="text-xs">
                {config.label}
              </Badge>
              {hasAgentSteps && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  <Bot className="h-3 w-3 mr-1" />
                  AI Agent
                </Badge>
              )}
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-slate-400" />
              ) : (
                <ChevronRight className="h-3 w-3 text-slate-400" />
              )}
            </div>
            <span className="text-xs text-slate-500">
              {format(new Date(execution.created_date), 'MMM d, h:mm a')}
            </span>
          </div>
        </CollapsibleTrigger>

        {execution.current_step && (
          <p className="text-xs text-slate-600 mb-1">
            Current: <span className="font-medium">{execution.current_step}</span>
          </p>
        )}

        {execution.step_results?.length > 0 && (
          <p className="text-xs text-slate-500">
            {execution.step_results.length} steps completed
          </p>
        )}

        {execution.error_message && (
          <p className="text-xs text-red-600 mt-2">
            Error: {execution.error_message}
          </p>
        )}

        <CollapsibleContent>
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
            {execution.step_results?.map((stepResult, idx) => (
              <ExecutionStepResult key={idx} stepResult={stepResult} index={idx} />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}