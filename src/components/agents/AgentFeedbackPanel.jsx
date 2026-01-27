import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, ThumbsUp, ThumbsDown, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import moment from 'moment';

export default function AgentFeedbackPanel({ agentId, orgId }) {
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [feedbackData, setFeedbackData] = useState({ rating: 0, comment: '', helpful: null });
  const queryClient = useQueryClient();

  const { data: executions = [] } = useQuery({
    queryKey: ['agent-executions', agentId],
    queryFn: () => base44.entities.AgentExecution.filter({ agent_id: agentId }, '-created_date', 10),
    enabled: !!agentId
  });

  const { data: agent } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => base44.entities.Agent.filter({ id: agentId }).then(a => a[0]),
    enabled: !!agentId
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({ execution_id, feedback }) => {
      await base44.entities.AgentExecution.update(execution_id, {
        user_feedback: feedback
      });
    },
    onSuccess: () => {
      toast.success('Feedback submitted');
      queryClient.invalidateQueries({ queryKey: ['agent-executions'] });
      setSelectedExecution(null);
      setFeedbackData({ rating: 0, comment: '', helpful: null });
    }
  });

  const handleSubmitFeedback = () => {
    if (feedbackData.rating === 0) {
      toast.error('Please provide a rating');
      return;
    }
    feedbackMutation.mutate({
      execution_id: selectedExecution.id,
      feedback: feedbackData
    });
  };

  const performanceMetrics = agent?.performance_metrics || {};

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 mb-1">Success Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-semibold">
                  {performanceMetrics.success_rate?.toFixed(1) || 0}%
                </p>
                {performanceMetrics.success_rate > 80 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 mb-1">Avg Satisfaction</p>
              <div className="flex items-center gap-1">
                <p className="text-xl font-semibold">
                  {performanceMetrics.user_satisfaction_avg?.toFixed(1) || 'N/A'}
                </p>
                {performanceMetrics.user_satisfaction_avg > 0 && (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 mb-1">Total Executions</p>
              <p className="text-xl font-semibold">{performanceMetrics.total_executions || 0}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 mb-1">Avg Time</p>
              <p className="text-xl font-semibold">
                {performanceMetrics.avg_execution_time_ms 
                  ? `${(performanceMetrics.avg_execution_time_ms / 1000).toFixed(1)}s`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Executions for Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {executions.map((execution) => (
              <div
                key={execution.id}
                className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                onClick={() => setSelectedExecution(execution)}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-slate-900 flex-1">
                    {execution.task}
                  </p>
                  <Badge variant={execution.status === 'completed' ? 'default' : 'destructive'} className="text-xs">
                    {execution.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{moment(execution.created_date).fromNow()}</span>
                  {execution.user_feedback ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span>{execution.user_feedback.rating}/5</span>
                    </div>
                  ) : (
                    <span className="text-blue-600">Add feedback</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Form */}
      {selectedExecution && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="text-base">Provide Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2">Was this execution helpful?</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={feedbackData.helpful === true ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeedbackData({ ...feedbackData, helpful: true })}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Yes
                </Button>
                <Button
                  variant={feedbackData.helpful === false ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeedbackData({ ...feedbackData, helpful: false })}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  No
                </Button>
              </div>
            </div>

            <div>
              <Label className="mb-2">Rating</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= feedbackData.rating
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Comments (Optional)</Label>
              <Textarea
                value={feedbackData.comment}
                onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                placeholder="How can this agent improve?"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmitFeedback}
                disabled={feedbackMutation.isPending}
                className="flex-1"
              >
                Submit Feedback
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedExecution(null);
                  setFeedbackData({ rating: 0, comment: '', helpful: null });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}