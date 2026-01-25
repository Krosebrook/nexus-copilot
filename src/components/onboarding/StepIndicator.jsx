import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center transition-all",
              index < currentStep ? "bg-blue-600 text-white" :
              index === currentStep ? "bg-blue-600 text-white ring-4 ring-blue-100" :
              "bg-slate-200 text-slate-400"
            )}>
              {index < currentStep ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="font-semibold">{index + 1}</span>
              )}
            </div>
            <p className={cn(
              "text-xs mt-2 font-medium",
              index <= currentStep ? "text-slate-900" : "text-slate-400"
            )}>
              {step.title}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              "h-0.5 w-16 mx-4 mt-[-20px] transition-all",
              index < currentStep ? "bg-blue-600" : "bg-slate-200"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}