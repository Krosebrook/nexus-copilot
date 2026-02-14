import React, { useState } from 'react';
import { TrendingUp, Zap, Shield, DollarSign, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const INSIGHT_CONFIG = {
  performance: {
    icon: Zap,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Performance'
  },
  reliability: {
    icon: Shield,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Reliability'
  },
  efficiency: {
    icon: TrendingUp,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Efficiency'
  },
  cost: {
    icon: DollarSign,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    label: 'Cost Optimization'
  }
};

const SEVERITY_CONFIG = {
  high: { color: 'text-red-600', bg: 'bg-red-100', label: 'High Impact' },
  medium: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Medium Impact' },
  low: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Low Impact' }
};

export default function InsightRecommendation({ insight, onApply }) {
  const [expanded, setExpanded] = useState(false);
  const [applied, setApplied] = useState(false);

  const config = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.performance;
  const severityConfig = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.medium;
  const Icon = config.icon;

  const handleApply = () => {
    if (onApply) {
      onApply(insight);
      setApplied(true);
    }
  };

  return (
    <Card className={cn("border transition-all", config.border, expanded && "shadow-md")}>
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{insight.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className={cn("text-xs", severityConfig.bg, severityConfig.color)}>
                    {severityConfig.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {config.label}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="h-6 w-6 p-0"
              >
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>

            {expanded && (
              <div className="mt-3 space-y-3">
                <div className="text-sm text-slate-600">
                  <p className="mb-2">{insight.description}</p>
                  
                  {insight.impact && (
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-xs font-semibold text-green-900 mb-1">Expected Impact:</p>
                      <p className="text-xs text-green-700">{insight.impact}</p>
                    </div>
                  )}
                </div>

                {insight.recommendation && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">Recommended Action:</p>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                      {insight.recommendation.action}
                    </p>

                    {insight.recommendation.step_changes && insight.recommendation.step_changes.length > 0 && (
                      <div className="text-xs">
                        <p className="font-semibold text-slate-700 mb-1">Changes Required:</p>
                        <ul className="space-y-1">
                          {insight.recommendation.step_changes.map((change, idx) => (
                            <li key={idx} className="text-slate-600 pl-2 border-l-2 border-slate-300">
                              {change.suggested_change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {onApply && (
                  <Button
                    size="sm"
                    onClick={handleApply}
                    disabled={applied}
                    className={cn(
                      "w-full",
                      applied ? "bg-green-600 hover:bg-green-700" : config.color
                    )}
                  >
                    {applied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Applied
                      </>
                    ) : (
                      'Apply Recommendation'
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}