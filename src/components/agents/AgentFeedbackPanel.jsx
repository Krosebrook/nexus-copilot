import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ThumbsUp, ThumbsDown, Edit, MessageSquare, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AgentFeedbackPanel({ execution, agentId, orgId, onFeedbackSubmitted }) {
  const [rating, setRating] = useState(0);
  const [wasHelpful, setWasHelpful] = useState(null);
  const [comment, setComment] = useState('');
  const [corrections, setCorrections] = useState([]);
  const [showCorrections, setShowCorrections] = useState(false);
  const queryClient = useQueryClient();

  const feedbackMutation = useMutation({
    mutationFn: async (feedbackData) => {
      const response = await base44.functions.invoke('agentProcessFeedback', {
        agent_id: agentId,
        execution_id: execution.id,
        org_id: orgId,
        ...feedbackData
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Feedback submitted - agent will learn from this');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      onFeedbackSubmitted?.();
    },
    onError: () => {
      toast.error('Failed to submit feedback');
    }
  });

  const handleSubmit = () => {
    if (!rating && wasHelpful === null) {
      toast.error('Please rate the execution or mark as helpful/not helpful');
      return;
    }

    feedbackMutation.mutate({
      feedback_type: corrections.length > 0 ? 'correction' : 'rating',
      rating: rating || undefined,
      was_helpful: wasHelpful,
      comment,
      corrections
    });
  };

  const addCorrection = (step) => {
    setCorrections([...corrections, {
      step_number: step.step_number,
      original_action: step.description,
      corrected_action: '',
      reason: ''
    }]);
    setShowCorrections(true);
  };

  const updateCorrection = (index, field, value) => {
    const updated = [...corrections];
    updated[index][field] = value;
    setCorrections(updated);
  };

  const removeCorrection = (index) => {
    setCorrections(corrections.filter((_, i) => i !== index));
  };

  return (
    <Card className="p-4 space-y-4 bg-slate-50">
      <div>
        <Label className="text-sm font-semibold">How helpful was this execution?</Label>
        <div className="flex gap-2 mt-2">
          <Button
            variant={wasHelpful === true ? 'default' : 'outline'}
            size="sm"
            onClick={() => setWasHelpful(true)}
            className="gap-2"
          >
            <ThumbsUp className="h-4 w-4" />
            Helpful
          </Button>
          <Button
            variant={wasHelpful === false ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setWasHelpful(false)}
            className="gap-2"
          >
            <ThumbsDown className="h-4 w-4" />
            Not Helpful
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">Rate execution quality</Label>
        <div className="flex gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-2xl ${star <= rating ? 'text-yellow-500' : 'text-slate-300'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {execution.plan && execution.plan.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold">Suggest corrections</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCorrections(!showCorrections)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {showCorrections ? 'Hide' : 'Show'} Corrections
            </Button>
          </div>

          {showCorrections && (
            <div className="space-y-3">
              {execution.plan.map((step) => (
                <div key={step.step_number} className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Step {step.step_number}</p>
                      <p className="text-sm text-slate-700">{step.description}</p>
                    </div>
                    {!corrections.find(c => c.step_number === step.step_number) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addCorrection(step)}
                      >
                        Correct
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {corrections.map((correction, idx) => (
                <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Step {correction.step_number} Correction</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCorrection(idx)}
                    >
                      Remove
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs">What should it do instead?</Label>
                    <Input
                      value={correction.corrected_action}
                      onChange={(e) => updateCorrection(idx, 'corrected_action', e.target.value)}
                      placeholder="Describe the correct action..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Why is this better?</Label>
                    <Input
                      value={correction.reason}
                      onChange={(e) => updateCorrection(idx, 'reason', e.target.value)}
                      placeholder="Explain the reasoning..."
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <Label className="text-sm font-semibold">Additional feedback (optional)</Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share any other thoughts about this execution..."
          rows={3}
          className="mt-2"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={feedbackMutation.isPending}
        className="w-full gap-2"
      >
        <Send className="h-4 w-4" />
        {feedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
      </Button>

      <p className="text-xs text-slate-500 text-center">
        Your feedback helps the agent improve future executions
      </p>
    </Card>
  );
}