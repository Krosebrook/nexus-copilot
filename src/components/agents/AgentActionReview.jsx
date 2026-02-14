import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ThumbsUp, ThumbsDown, CheckCircle, AlertCircle, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AgentActionReview({ execution, onFeedbackSubmit }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [rating, setRating] = useState(null);
  const queryClient = useQueryClient();

  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ helpful, comment, rating }) => {
      await base44.entities.AgentExecution.update(execution.id, {
        user_feedback: {
          helpful,
          comment,
          rating,
          submitted_at: new Date().toISOString()
        }
      });

      // Update agent learning
      const agents = await base44.entities.Agent.filter({ id: execution.agent_id });
      if (agents.length > 0) {
        const agent = agents[0];
        const metrics = agent.performance_metrics || {};
        const totalFeedback = (metrics.total_feedback || 0) + 1;
        const currentAvg = metrics.user_satisfaction_avg || 0;
        const newAvg = ((currentAvg * (totalFeedback - 1)) + rating) / totalFeedback;

        await base44.entities.Agent.update(agent.id, {
          performance_metrics: {
            ...metrics,
            user_satisfaction_avg: newAvg,
            total_feedback: totalFeedback
          }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-executions'] });
      toast.success('Feedback submitted', {
        description: 'This will help the agent improve future executions'
      });
      onFeedbackSubmit?.();
    }
  });

  const handleFeedback = (helpful) => {
    setShowFeedback(true);
    if (helpful) {
      setRating(5);
    } else {
      setRating(2);
    }
  };

  const submitFeedback = () => {
    if (!rating) {
      toast.error('Please provide a rating');
      return;
    }

    submitFeedbackMutation.mutate({
      helpful: rating >= 3,
      comment: feedbackComment,
      rating
    });

    setShowFeedback(false);
  };

  const hasFeedback = execution.user_feedback?.submitted_at;

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          Agent Execution Summary
          {execution.status === 'completed' && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Completed
            </Badge>
          )}
          {execution.status === 'failed' && (
            <Badge variant="destructive">Failed</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task */}
        <div>
          <p className="text-xs text-slate-500 mb-1">Task</p>
          <p className="text-sm text-slate-700">{execution.task}</p>
        </div>

        {/* Execution Plan */}
        {execution.plan && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Execution Steps</p>
            <div className="space-y-2">
              {execution.plan.map((step, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-lg text-sm",
                    step.status === 'completed' ? "bg-green-50" : 
                    step.status === 'failed' ? "bg-red-50" : "bg-slate-50"
                  )}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : step.status === 'failed' ? (
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-slate-300 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-slate-700">{step.description}</p>
                    {step.tool && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tool: {step.tool}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {execution.error_message && (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs font-medium text-red-700 mb-1">Error</p>
            <p className="text-sm text-red-600">{execution.error_message}</p>
          </div>
        )}

        {/* Feedback Section */}
        {execution.status === 'completed' && !hasFeedback && !showFeedback && (
          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-600 mb-3">Was this execution helpful?</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFeedback(true)}
                className="flex-1 gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                Yes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFeedback(false)}
                className="flex-1 gap-2"
              >
                <ThumbsDown className="h-4 w-4" />
                No
              </Button>
            </div>
          </div>
        )}

        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-slate-200 pt-4 space-y-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={cn(
                      "h-8 w-8 text-lg transition-colors",
                      rating >= star ? "text-yellow-500" : "text-slate-300"
                    )}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                How can the agent improve? (Optional)
              </p>
              <Textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Share your thoughts to help the agent learn..."
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={submitFeedback}
                disabled={submitFeedbackMutation.isPending}
                className="flex-1"
              >
                Submit Feedback
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowFeedback(false)}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {hasFeedback && (
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                Feedback Submitted
              </Badge>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={cn(
                      "text-sm",
                      execution.user_feedback.rating >= star ? "text-yellow-500" : "text-slate-300"
                    )}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            {execution.user_feedback.comment && (
              <p className="text-sm text-slate-600 italic">
                "{execution.user_feedback.comment}"
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}