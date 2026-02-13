import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function OnboardingWizard({ steps, currentStep, onStepComplete, onBack, onFinish }) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-slate-500">{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-slate-900"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-3 mb-12">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300",
                  idx < currentStep
                    ? "bg-slate-900 text-white shadow-sm"
                    : idx === currentStep
                    ? "bg-slate-900 text-white shadow-lg scale-110"
                    : "bg-slate-200 text-slate-400"
                )}
              >
                {idx < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{idx + 1}</span>
                )}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "h-1 w-12 mx-2 transition-all duration-300",
                    idx < currentStep ? "bg-slate-900" : "bg-slate-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
          >
            {steps[currentStep].component}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
              <Button
                variant="ghost"
                onClick={onBack}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={onFinish}
                  className="bg-slate-900 hover:bg-slate-800 gap-2 shadow-sm"
                >
                  Get Started
                  <Check className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={onStepComplete}
                  className="bg-slate-900 hover:bg-slate-800 gap-2 shadow-sm"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}