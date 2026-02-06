import React from 'react';
import { Activity, Users, CheckCircle, TrendingUp, Clock, Search, LineChart, BarChart } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const WIDGET_TYPES = [
  { 
    type: 'workflow_executions',
    title: 'Workflow Executions',
    description: 'Track workflow runs and success rates',
    icon: Activity
  },
  { 
    type: 'knowledge_usage',
    title: 'Knowledge Base Usage',
    description: 'Monitor knowledge article engagement',
    icon: Search
  },
  { 
    type: 'copilot_queries',
    title: 'Copilot Queries',
    description: 'Track Copilot usage and response times',
    icon: TrendingUp
  },
  { 
    type: 'agent_performance',
    title: 'Agent Performance',
    description: 'Monitor AI agent success rates',
    icon: CheckCircle
  },
  { 
    type: 'user_activity',
    title: 'User Activity',
    description: 'Track team member engagement',
    icon: Users
  },
  { 
    type: 'response_time_chart',
    title: 'Response Times',
    description: 'Average response time trends',
    icon: Clock
  },
  { 
    type: 'predictive_workflow_success',
    title: 'Workflow Success Forecast',
    description: 'Predict future workflow success rates',
    icon: LineChart,
    isPredictive: true
  },
  { 
    type: 'predictive_knowledge_engagement',
    title: 'Knowledge Engagement Forecast',
    description: 'Predict knowledge base engagement trends',
    icon: BarChart,
    isPredictive: true
  },
  { 
    type: 'predictive_agent_performance',
    title: 'Agent Performance Forecast',
    description: 'Predict AI agent performance trends',
    icon: TrendingUp,
    isPredictive: true
  }
];

export default function WidgetLibrary({ onAddWidget, existingWidgets }) {
  const existingTypes = existingWidgets.map(w => w.widget_type);

  return (
    <div className="space-y-4">
      {/* Standard Widgets */}
      <div>
        <h3 className="text-sm font-medium text-slate-900 mb-3">Standard Widgets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WIDGET_TYPES.filter(w => !w.isPredictive).map((widget) => {
            const Icon = widget.icon;
            const alreadyAdded = existingTypes.includes(widget.type);
            
            return (
              <Card 
                key={widget.type}
                className={`hover:shadow-md transition-shadow ${alreadyAdded ? 'opacity-50' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Icon className="h-5 w-5 text-slate-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">
                        {widget.title}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {widget.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={alreadyAdded}
                    onClick={() => onAddWidget(widget.type, widget.title)}
                  >
                    {alreadyAdded ? 'Already Added' : 'Add Widget'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Predictive Analytics Widgets */}
      <div>
        <h3 className="text-sm font-medium text-slate-900 mb-3">
          Predictive Analytics
          <span className="ml-2 text-xs font-normal text-blue-600">AI-Powered</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WIDGET_TYPES.filter(w => w.isPredictive).map((widget) => {
            const Icon = widget.icon;
            const alreadyAdded = existingTypes.includes(widget.type);
            
            return (
              <Card 
                key={widget.type}
                className={`hover:shadow-md transition-shadow border-blue-200 ${alreadyAdded ? 'opacity-50' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Icon className="h-5 w-5 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">
                        {widget.title}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {widget.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={alreadyAdded}
                    onClick={() => onAddWidget(widget.type, widget.title)}
                  >
                    {alreadyAdded ? 'Already Added' : 'Add Widget'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}