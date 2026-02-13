import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { 
  Copy, Check, Bookmark, BookmarkCheck, Share2, 
  MoreHorizontal, Clock, Zap, ChevronDown, ChevronUp, AlertTriangle,
  ThumbsUp, ThumbsDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import FeedbackWidget from './FeedbackWidget';

const TYPE_LABELS = {
  answer: { label: 'Answer', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  summary: { label: 'Summary', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  action: { label: 'Action', color: 'bg-green-50 text-green-700 border-green-200' },
  analysis: { label: 'Analysis', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  clarification: { label: 'Clarification', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export default function ResponseCard({ 
  query, 
  onSave, 
  onShare,
  onFeedback,
  compact = false 
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(!compact);

  const typeConfig = TYPE_LABELS[query.response_type] || TYPE_LABELS.answer;

  // Determine urgency
  const isUrgent = query.response_type === 'action' || 
                   query.response?.toLowerCase().includes('critical') ||
                   query.response?.toLowerCase().includes('urgent');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(query.response || '');
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSave?.(query);
    toast.success(query.is_saved ? 'Removed from saved' : 'Saved for later');
  };

  return (
    <div className={cn(
      "group bg-white border-0 rounded-2xl transition-all duration-100 shadow-sm",
      "hover:shadow-md",
      isUrgent && "border-l-4 border-l-red-600 shadow-lg"
    )}>
      {/* Urgent Badge */}
      {isUrgent && (
        <div className="flex items-center gap-2 px-4 pt-3">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
            Action Required
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-2">
            {query.prompt}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={cn("text-[10px] font-medium", typeConfig.color)}>
              {typeConfig.label}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              {format(new Date(query.created_date), 'MMM d, h:mm a')}
            </span>
            {query.latency_ms && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Zap className="h-3 w-3" />
                {query.latency_ms}ms
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
          >
            {query.is_saved ? (
              <BookmarkCheck className="h-4 w-4 text-amber-500" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onShare?.(query)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Response */}
      <div className="p-4 pt-3">
        <div className={cn(
          "prose prose-sm prose-slate max-w-none",
          !expanded && "line-clamp-3"
        )}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="text-slate-600 leading-relaxed mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="my-2 ml-4 list-disc text-slate-600">{children}</ul>,
              ol: ({ children }) => <ol className="my-2 ml-4 list-decimal text-slate-600">{children}</ol>,
              li: ({ children }) => <li className="my-0.5">{children}</li>,
              code: ({ inline, children }) => 
                inline ? (
                  <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-700">{children}</code>
                ) : (
                  <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto text-xs my-2">
                    <code>{children}</code>
                  </pre>
                ),
              strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
            }}
          >
            {query.response || 'Processing...'}
          </ReactMarkdown>
        </div>

        {compact && query.response?.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mt-2"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Show more
              </>
            )}
          </button>
        )}
      </div>

      {/* Context Sources */}
      {(query.integration_refs?.length > 0 || query.context_refs?.length > 0) && (
        <div className="px-4 pb-2 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500 mb-1.5">Sources used:</p>
          <div className="flex flex-wrap gap-1">
            {query.integration_refs?.map((ref, idx) => (
              <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                <Zap className="h-3 w-3 mr-1" />
                {ref.integration_type}
              </Badge>
            ))}
            {query.context_refs?.length > 0 && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <BookmarkCheck className="h-3 w-3 mr-1" />
                {query.context_refs.length} doc{query.context_refs.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {query.tags?.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {query.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Inline Actions */}
      <div className="px-4 pb-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3 w-3 mr-1 text-green-600" /> : <Copy className="h-3 w-3 mr-1" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={handleSave}
          >
            {query.is_saved ? (
              <><BookmarkCheck className="h-3 w-3 mr-1 text-amber-600" />Saved</>
            ) : (
              <><Bookmark className="h-3 w-3 mr-1" />Save</>
            )}
          </Button>
        </div>
        
        {query.status === 'completed' && onFeedback && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                onFeedback(query, { rating: 5, feedback_type: 'helpful', sentiment: 'positive' });
                toast.success('Thanks for your feedback!');
              }}
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                onFeedback(query, { rating: 2, feedback_type: 'incorrect', sentiment: 'negative' });
                toast.success('Feedback recorded');
              }}
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}