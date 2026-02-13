import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

const tourSteps = [
  {
    target: '[data-tour="copilot-button"]',
    title: 'AI Copilot',
    description: 'Ask questions and get instant answers from your knowledge base',
    position: 'bottom'
  },
  {
    target: '[data-tour="search-button"]',
    title: 'Global Search',
    description: 'Search across all your knowledge articles and queries',
    position: 'bottom'
  },
  {
    target: '[data-tour="workspace-menu"]',
    title: 'Workspace',
    description: 'Access knowledge base, workflows, agents, and settings',
    position: 'bottom'
  }
];

export default function FeatureTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const element = document.querySelector(tourSteps[currentStep].target);
    if (element) {
      const rect = element.getBoundingClientRect();
      const tourPos = tourSteps[currentStep].position;
      
      setPosition({
        top: tourPos === 'bottom' ? rect.bottom + 10 : rect.top - 10,
        left: rect.left + rect.width / 2
      });

      // Highlight element
      element.classList.add('ring-2', 'ring-slate-900', 'ring-offset-2');
      return () => {
        element.classList.remove('ring-2', 'ring-slate-900', 'ring-offset-2');
      };
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('feature_tour_completed', 'true');
    onComplete?.();
  };

  if (!isVisible) return null;

  const step = tourSteps[currentStep];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 z-[100]"
            onClick={handleClose}
          />

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              transform: 'translateX(-50%)',
            }}
            className="z-[101] w-80 bg-white rounded-xl shadow-2xl p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-slate-700 mb-1">{step.title}</h3>
                <p className="text-sm text-slate-600">{step.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 -mt-2 -mr-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                {currentStep + 1} of {tourSteps.length}
              </span>
              <Button
                onClick={handleNext}
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 gap-2"
              >
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}