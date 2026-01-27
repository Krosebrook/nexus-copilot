import React from 'react';
import { 
  Activity, Brain, Book, Zap, Users, TrendingUp, 
  Clock, Target, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const WIDGET_CATALOG = [
  {
    type: 'workflow_executions',
    title: 'Workflow Executions',
    description: 'Track workflow runs and success rates',
    icon: Activity,
    category: 'automation'
  },
  {
    type: 'knowledge_usage',
    title: 'Knowledge Base Usage',
    description: 'Most accessed articles and trends',
    icon: Book,
    category: 'knowledge'
  },
  {
    type: 'copilot_queries',
    title: 'Copilot Activity',
    description: 'Query volume and response times',
    icon: Brain,
    category: 'copilot'
  },
  {
    type: 'agent_performance',
    title: 'Agent Performance',
    description: 'AI agent success rates and satisfaction',
    icon: Zap,
    category: 'agents'
  },
  {
    type: 'user_activity',
    title: 'User Activity',
    description: 'Individual user engagement metrics',
    icon: Users,
    category: 'team'
  },
  {
    type: 'success_rate_trend',
    title: 'Success Rate Trends',
    description: 'Predictive analytics for workflows',
    icon: TrendingUp,
    category: 'analytics'
  },
  {
    type: 'response_time_chart',
    title: 'Response Times',
    description: 'System performance over time',
    icon: Clock,
    category: 'performance'
  },
  {
    type: 'top_queries',
    title: 'Top Queries',
    description: 'Most common Copilot questions',
    icon: Target,
    category: 'insights'
  }
];

export default function WidgetLibrary({ onAddWidget, existingWidgets = [] }) {
  const existingTypes = existingWidgets.map(w => w.widget_type);
  const availableWidgets = WIDGET_CATALOG.filter(w => !existingTypes.includes(w.type));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Widget</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {availableWidgets.map((widget) => {
            const Icon = widget.icon;
            return (
              <button
                key={widget.type}
                onClick={() => onAddWidget(widget.type, widget.title)}
                className="p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <Icon className="h-5 w-5 text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-900">{widget.title}</p>
                <p className="text-xs text-slate-500 mt-1">{widget.description}</p>
              </button>
            );
          })}
        </div>
        {availableWidgets.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            All widgets added
          </p>
        )}
      </CardContent>
    </Card>
  );
}