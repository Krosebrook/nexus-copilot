import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { 
  Copy, Check, Bookmark, BookmarkCheck, Share2, 
  MoreHorizontal, Clock, Zap, ChevronDown, ChevronUp 
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
  compact = false 
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(!compact);

  const typeConfig = TYPE_LABELS[query.response_type] || TYPE_LABELS.answer;

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
      "group bg-white border border-slate-200 rounded-2xl transition-all duration-200",
      "hover:border-slate-300 hover:shadow-sm"
    )}>
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

      {/* Tags */}
      {query.tags?.length > 0 && (
        <div className="px-4 pb-4 flex flex-wrap gap-1">
          {query.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}