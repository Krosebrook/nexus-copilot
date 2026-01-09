import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Star, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function FeedbackWidget({ query, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState(null);
  const [comment, setComment] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleQuickFeedback = async (isPositive) => {
    const quickRating = isPositive ? 5 : 2;
    await onSubmit({
      rating: quickRating,
      feedback_type: isPositive ? 'helpful' : 'incomplete',
      sentiment: isPositive ? 'positive' : 'negative',
    });
    setSubmitted(true);
  };

  const handleDetailedFeedback = async () => {
    if (rating === 0) return;
    
    await onSubmit({
      rating,
      feedback_type: feedbackType,
      comment: comment.trim() || undefined,
      sentiment: rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative',
    });
    
    setSubmitted(true);
    setShowDialog(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600">
        <ThumbsUp className="h-3 w-3" />
        <span>Thanks for your feedback!</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickFeedback(true)}
          className="h-7 px-2 text-slate-400 hover:text-green-600"
        >
          <ThumbsUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickFeedback(false)}
          className="h-7 px-2 text-slate-400 hover:text-red-600"
        >
          <ThumbsDown className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDialog(true)}
          className="h-7 px-2 text-slate-400 hover:text-slate-700"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Detailed
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate this response</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Star Rating */}
            <div>
              <label className="text-sm font-medium mb-2 block">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={cn(
                      "p-1 transition-colors",
                      star <= rating ? "text-amber-500" : "text-slate-300 hover:text-amber-400"
                    )}
                  >
                    <Star className="h-6 w-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">What describes this response?</label>
              <div className="flex flex-wrap gap-2">
                {['helpful', 'accurate', 'incomplete', 'incorrect', 'too_verbose', 'too_brief'].map((type) => (
                  <Button
                    key={type}
                    variant={feedbackType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFeedbackType(type)}
                  >
                    {type.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="text-sm font-medium mb-2 block">Additional feedback (optional)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Help us improve Copilot..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleDetailedFeedback}
              disabled={rating === 0}
              className="w-full"
            >
              Submit Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}