import React, { useState } from 'react';
import { Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function WorkflowSuggestions({ 
  suggestions, 
  isLoading, 
  onApply, 
  onRefresh 
}) {
  const [expandedId, setExpandedId] = useState(null);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-sm text-slate-600">Analyzing your workspace patterns...</p>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Workflow Suggestions
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <Sparkles className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={cn(
              "bg-white rounded-lg border border-slate-200 p-4 cursor-pointer transition-all hover:shadow-md",
              expandedId === suggestion.id && "shadow-md"
            )}
            onClick={() => setExpandedId(expandedId === suggestion.id ? null : suggestion.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">{suggestion.name}</h3>
                <p className="text-sm text-slate-600">{suggestion.description}</p>
              </div>
              <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700 border-purple-200">
                {suggestion.confidence}% match
              </Badge>
            </div>

            {expandedId === suggestion.id && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-2">Workflow Steps:</p>
                  <div className="space-y-1.5">
                    {suggestion.steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-medium">
                          {idx + 1}
                        </div>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium">Trigger:</span>
                  <span className="capitalize">{suggestion.trigger_type.replace('_', ' ')}</span>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onApply(suggestion);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Use This Template
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}