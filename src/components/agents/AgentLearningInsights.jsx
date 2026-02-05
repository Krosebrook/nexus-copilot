import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Brain, TrendingUp, TrendingDown, Target, AlertCircle, 
  Check, X, Lightbulb, BarChart3, Activity 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function AgentLearningInsights({ agent, orgId }) {
  const [activeTab, setActiveTab] = useState('suggestions');
  const queryClient = useQueryClient();

  const runLearningMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('agentLearning', {
        agent_id: agent.id,
        org_id: orgId,
        analysis_type: 'full'
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Analysis complete! Generated ${data.learning?.persona_suggestions?.length || 0} suggestions`);
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (error) => {
      toast.error(`Learning analysis failed: ${error.message}`);
    }
  });

  const applyPersonaSuggestionMutation = useMutation({
    mutationFn: async (suggestion) => {
      const updates = {};
      
      if (suggestion.type === 'persona_tone') {
        updates.persona = {
          ...agent.persona,
          tone: suggestion.suggested_value
        };
      } else if (suggestion.type === 'expertise_areas') {
        updates.persona = {
          ...agent.persona,
          expertise_areas: suggestion.suggested_value
        };
      } else if (suggestion.type === 'custom_instructions') {
        updates.persona = {
          ...agent.persona,
          custom_instructions: suggestion.suggested_value
        };
      }

      await base44.entities.Agent.update(agent.id, updates);
      return suggestion;
    },
    onSuccess: (suggestion) => {
      toast.success(`Applied suggestion: ${suggestion.type}`);
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });

  const learningData = agent.learning_data || {};
  const hasSuggestions = learningData.persona_suggestions?.length > 0;
  const hasData = learningData.sample_size > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Learning & Adaptation</h3>
            <p className="text-sm text-slate-500">
              {hasData 
                ? `Based on ${learningData.sample_size} executions` 
                : 'No learning data yet'}
            </p>
          </div>
        </div>
        <Button
          onClick={() => runLearningMutation.mutate()}
          disabled={runLearningMutation.isPending}
        >
          <Brain className="h-4 w-4 mr-2" />
          {runLearningMutation.isPending ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-slate-900 mb-2">
              No Learning Data Available
            </h4>
            <p className="text-slate-500 mb-4 max-w-md mx-auto">
              The agent needs at least 10 executions before learning analysis can begin. 
              Run the agent a few times and check back.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="suggestions">
              Suggestions
              {hasSuggestions && (
                <Badge variant="secondary" className="ml-2">
                  {learningData.persona_suggestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="recommendations">Tools</TabsTrigger>
          </TabsList>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4">
            {!hasSuggestions ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-slate-600">
                    No suggestions at this time. The agent is performing well!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {learningData.persona_suggestions.map((suggestion, idx) => (
                  <SuggestionCard
                    key={idx}
                    suggestion={suggestion}
                    onApply={() => applyPersonaSuggestionMutation.mutate(suggestion)}
                    isApplying={applyPersonaSuggestionMutation.isPending}
                  />
                ))}
              </div>
            )}

            {learningData.capability_recommendations?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Capability Recommendations</CardTitle>
                  <CardDescription>
                    Consider adding these capabilities based on usage patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {learningData.capability_recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{rec.capability}</div>
                          <div className="text-xs text-slate-500">{rec.reason}</div>
                        </div>
                        <Badge variant="outline">
                          {Math.round(rec.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Success Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {learningData.successful_patterns?.length > 0 ? (
                    <div className="space-y-3">
                      {learningData.successful_patterns.map((pattern, idx) => (
                        <PatternCard key={idx} pattern={pattern} type="success" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No patterns identified yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    Failure Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {learningData.failed_patterns?.length > 0 ? (
                    <div className="space-y-3">
                      {learningData.failed_patterns.map((pattern, idx) => (
                        <PatternCard key={idx} pattern={pattern} type="failure" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      No failure patterns - excellent!
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            {learningData.improvement_metrics?.insufficient_data ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">{learningData.improvement_metrics.message}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  label="Success Rate Improvement"
                  value={learningData.improvement_metrics?.success_rate_improvement}
                  trend={learningData.improvement_metrics?.trend}
                  icon={Activity}
                />
                <MetricCard
                  label="Rating Improvement"
                  value={learningData.improvement_metrics?.rating_improvement}
                  trend={parseFloat(learningData.improvement_metrics?.rating_improvement) > 0 ? 'improving' : 'declining'}
                  icon={Target}
                />
                <MetricCard
                  label="Speed Improvement"
                  value={learningData.improvement_metrics?.speed_improvement}
                  trend={learningData.improvement_metrics?.trend}
                  icon={TrendingUp}
                />
              </div>
            )}
          </TabsContent>

          {/* Tool Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            {learningData.tool_recommendations?.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {learningData.tool_recommendations.map((rec, idx) => (
                  <Card key={idx}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{rec.tool_name}</CardTitle>
                        <Badge variant="outline">
                          {Math.round(rec.confidence * 100)}% match
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600">{rec.reason}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Lightbulb className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No tool recommendations at this time</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function SuggestionCard({ suggestion, onApply, isApplying }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const confidenceColor = suggestion.confidence >= 0.8 
    ? 'text-green-600' 
    : suggestion.confidence >= 0.6 
    ? 'text-yellow-600' 
    : 'text-orange-600';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Lightbulb className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-slate-900">
                {suggestion.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h4>
              <Badge variant="outline" className={confidenceColor}>
                {Math.round(suggestion.confidence * 100)}% confidence
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mb-3">{suggestion.reason}</p>
            <div className="flex items-center gap-3 text-xs">
              <div>
                <span className="text-slate-500">Current:</span>
                <span className="ml-1 font-medium">{String(suggestion.current_value).substring(0, 50)}</span>
              </div>
              <span className="text-slate-300">→</span>
              <div>
                <span className="text-slate-500">Suggested:</span>
                <span className="ml-1 font-medium text-blue-600">{String(suggestion.suggested_value).substring(0, 50)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onApply}
              disabled={isApplying}
            >
              <Check className="h-4 w-4 mr-1" />
              Apply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PatternCard({ pattern, type }) {
  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const textColor = isSuccess ? 'text-green-700' : 'text-red-700';

  return (
    <div className={`p-3 rounded-lg ${bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${textColor}`}>
          {pattern.task_type}
        </span>
        <Badge variant="secondary" className="text-xs">
          {pattern.frequency} times
        </Badge>
      </div>
      {pattern.avg_execution_time_ms && (
        <div className="text-xs text-slate-600">
          Avg time: {Math.round(pattern.avg_execution_time_ms)}ms
        </div>
      )}
      {pattern.common_steps?.length > 0 && (
        <div className="text-xs text-slate-600 mt-1">
          Common steps: {pattern.common_steps.slice(0, 2).join(', ')}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, trend, icon: Icon }) {
  const trendColor = trend === 'improving' ? 'text-green-600' : 'text-red-600';
  const TrendIcon = trend === 'improving' ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <Icon className="h-5 w-5 text-slate-400" />
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </CardContent>
    </Card>
  );
}
