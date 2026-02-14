import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Brain, TrendingUp, Target, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function AgentLearningDashboard({ agentId, orgId }) {
  const { data: executions = [] } = useQuery({
    queryKey: ['agent-learning', agentId],
    queryFn: () => base44.entities.AgentExecution.filter({ 
      agent_id: agentId, 
      org_id: orgId 
    }, '-created_date', 100),
    enabled: !!agentId && !!orgId,
  });

  const { data: agent } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const agents = await base44.entities.Agent.filter({ id: agentId });
      return agents[0];
    },
    enabled: !!agentId,
  });

  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter(e => e.status === 'completed').length;
  const executionsWithFeedback = executions.filter(e => e.user_feedback).length;
  const positivelyRatedExecutions = executions.filter(e => e.user_feedback?.helpful).length;

  const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
  const feedbackRate = totalExecutions > 0 ? (executionsWithFeedback / totalExecutions) * 100 : 0;
  const satisfactionRate = executionsWithFeedback > 0 ? (positivelyRatedExecutions / executionsWithFeedback) * 100 : 0;

  const avgRating = executionsWithFeedback > 0
    ? executions
        .filter(e => e.user_feedback?.rating)
        .reduce((sum, e) => sum + e.user_feedback.rating, 0) / executionsWithFeedback
    : 0;

  const learningInsights = [];
  
  if (successRate < 70) {
    learningInsights.push({
      type: 'warning',
      message: 'Success rate is below optimal. Review failed executions for patterns.'
    });
  }

  if (feedbackRate < 30) {
    learningInsights.push({
      type: 'info',
      message: 'Limited feedback data. Encourage users to provide feedback for better learning.'
    });
  }

  if (satisfactionRate > 80) {
    learningInsights.push({
      type: 'success',
      message: 'High user satisfaction! Agent is performing well.'
    });
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-700">
            <Brain className="h-5 w-5" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-medium text-slate-600">Success Rate</p>
              </div>
              <p className="text-2xl font-bold text-slate-700">{Math.round(successRate)}%</p>
              <Progress value={successRate} className="h-1 mt-2" />
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-green-600" />
                <p className="text-xs font-medium text-slate-600">Avg Rating</p>
              </div>
              <p className="text-2xl font-bold text-slate-700">{avgRating.toFixed(1)}/5</p>
              <Progress value={(avgRating / 5) * 100} className="h-1 mt-2" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Total Executions</span>
              <span className="font-medium text-slate-700">{totalExecutions}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Feedback Collected</span>
              <span className="font-medium text-slate-700">{executionsWithFeedback}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">User Satisfaction</span>
              <span className="font-medium text-slate-700">{Math.round(satisfactionRate)}%</span>
            </div>
          </div>

          {learningInsights.length > 0 && (
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <p className="text-xs font-medium text-slate-600">Insights</p>
              {learningInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded text-xs ${
                    insight.type === 'success' ? 'bg-green-50 text-green-700' :
                    insight.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                    'bg-blue-50 text-blue-700'
                  }`}
                >
                  {insight.message}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}