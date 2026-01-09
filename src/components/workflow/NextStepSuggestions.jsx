import React from 'react';
import { Lightbulb, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NextStepSuggestions({ workflow, suggestions, onAdd }) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-amber-50 border-amber-200 p-4">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900 mb-2">Suggested next steps:</p>
          <div className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-200"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{suggestion.label}</p>
                  <p className="text-xs text-slate-500">{suggestion.reason}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAdd(suggestion)}
                  className="ml-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}