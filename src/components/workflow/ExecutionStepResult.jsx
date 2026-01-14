import React from 'react';
import { CheckCircle, XCircle, Loader2, Bot } from 'lucide-react';

export default function ExecutionStepResult({ stepResult, index }) {
  const isAgentStep = stepResult.step_type === 'ai_agent' || 
                      stepResult.config?.action === 'ai_agent';
  
  const statusIcons = {
    completed: <CheckCircle className="h-3 w-3 text-green-500" />,
    failed: <XCircle className="h-3 w-3 text-red-500" />,
    running: <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />,
  };

  return (
    <div className={`p-2 rounded text-xs ${
      isAgentStep ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-slate-200'
    }`}>
      <div className="flex items-center gap-2 mb-1">
        {isAgentStep && <Bot className="h-3 w-3 text-blue-600" />}
        <span className="font-medium text-slate-700">
          Step {index + 1}: {stepResult.step_type || stepResult.config?.action || 'Unknown'}
        </span>
        {statusIcons[stepResult.status]}
      </div>

      {isAgentStep && (
        <div className="space-y-1">
          {stepResult.agent_goal && (
            <p className="text-slate-600">
              <strong>Goal:</strong> {stepResult.agent_goal}
            </p>
          )}
          {stepResult.autonomy_level && (
            <p className="text-slate-600">
              <strong>Autonomy:</strong> {stepResult.autonomy_level}
            </p>
          )}
          {stepResult.steps_taken && (
            <p className="text-slate-600">
              <strong>Steps taken:</strong> {stepResult.steps_taken} / {stepResult.max_steps || 10}
            </p>
          )}
        </div>
      )}

      {stepResult.result && (
        <div className="mt-1">
          <p className="text-slate-500 font-medium">Result:</p>
          <pre className="text-slate-600 mt-1 whitespace-pre-wrap overflow-auto max-h-24">
            {typeof stepResult.result === 'string' 
              ? stepResult.result 
              : JSON.stringify(stepResult.result, null, 2)}
          </pre>
        </div>
      )}

      {stepResult.error && (
        <p className="text-red-600 mt-1">
          <strong>Error:</strong> {stepResult.error}
        </p>
      )}
    </div>
  );
}