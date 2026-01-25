import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from '@/utils';
import confetti from 'canvas-confetti';

export default function CompletionStep({ orgName, onComplete }) {
  const celebrate = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  React.useEffect(() => {
    celebrate();
  }, []);

  return (
    <div className="space-y-6 text-center">
      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
        <Sparkles className="h-10 w-10 text-white" />
      </div>
      
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3">
          🎉 You're All Set!
        </h2>
        <p className="text-lg text-slate-600 mb-2">
          Welcome to <span className="font-semibold">{orgName}</span>
        </p>
        <p className="text-slate-500">
          Your workspace is ready. Let's explore what you can do.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 my-8 text-left">
        <div className="p-4 bg-blue-50 rounded-xl">
          <div className="text-2xl mb-1">🤖</div>
          <p className="font-semibold text-slate-900 text-sm">AI Copilot</p>
          <p className="text-xs text-slate-600">Ask questions, get insights</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-xl">
          <div className="text-2xl mb-1">📚</div>
          <p className="font-semibold text-slate-900 text-sm">Knowledge Base</p>
          <p className="text-xs text-slate-600">Organize your documents</p>
        </div>
        <div className="p-4 bg-green-50 rounded-xl">
          <div className="text-2xl mb-1">⚡</div>
          <p className="font-semibold text-slate-900 text-sm">Workflows</p>
          <p className="text-xs text-slate-600">Automate your processes</p>
        </div>
      </div>

      <Button onClick={onComplete} size="lg" className="w-full">
        Go to Dashboard
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
}