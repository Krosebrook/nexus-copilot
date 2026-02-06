import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ExecutionFeedbackDialog({ execution, open, onClose }) {
  const [feedback, setFeedback] = useState({
    rating: 0,
    helpful: null,
    comment: ''
  });
  const queryClient = useQueryClient();

  const submitFeedbackMutation = useMutation({
    mutationFn: async () => {
      // Update execution with feedback
      await base44.entities.AgentExecution.update(execution.id, {
        user_feedback: feedback
      });

      // Trigger agent learning analysis
      await base44.functions.invoke('agentLearning', {
        agent_id: execution.agent_id,
        org_id: execution.org_id,
        analysis_type: 'incremental'
      });
    },
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
      queryClient.invalidateQueries({ queryKey: ['agent-executions'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to submit feedback: ' + error.message);
    }
  });

  const handleSubmit = () => {
    if (feedback.rating === 0) {
      toast.error('Please provide a rating');
      return;
    }
    submitFeedbackMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>How did the agent perform?</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Summary */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Task:</p>
            <p className="text-sm font-medium text-slate-900">{execution.task}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Completed in {(execution.execution_time_ms / 1000).toFixed(1)}s
            </div>
          </div>

          {/* Helpful Rating */}
          <div className="space-y-3">
            <Label>Was this execution helpful?</Label>
            <div className="flex gap-2">
              <Button
                variant={feedback.helpful === true ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setFeedback({ ...feedback, helpful: true })}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Yes
              </Button>
              <Button
                variant={feedback.helpful === false ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setFeedback({ ...feedback, helpful: false })}
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                No
              </Button>
            </div>
          </div>

          {/* Star Rating */}
          <div className="space-y-3">
            <Label>Rate the overall performance</Label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFeedback({ ...feedback, rating: star })}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= feedback.rating
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-slate-500">
              {feedback.rating === 0 && 'Click to rate'}
              {feedback.rating === 1 && 'Poor'}
              {feedback.rating === 2 && 'Fair'}
              {feedback.rating === 3 && 'Good'}
              {feedback.rating === 4 && 'Very Good'}
              {feedback.rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-3">
            <Label>Additional comments (optional)</Label>
            <Textarea
              value={feedback.comment}
              onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
              placeholder="What could be improved? What did the agent do well?"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={submitFeedbackMutation.isPending || feedback.rating === 0}
              className="flex-1"
            >
              {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}