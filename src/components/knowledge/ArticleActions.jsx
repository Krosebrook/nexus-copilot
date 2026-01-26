import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, FileText, Link2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

export default function ArticleActions({ article, allArticles, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('knowledgeAI', {
        action: 'summarize',
        content: article.content,
      });
      setSummary(data.summary);
      setShowSummary(true);
      toast.success('Summary generated');
    } catch (e) {
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const findRelated = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('knowledgeAI', {
        action: 'suggest_related',
        content: article.content,
        org_id: article.org_id,
      });
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
      toast.success('Related articles found');
    } catch (e) {
      toast.error('Failed to find related articles');
    } finally {
      setLoading(false);
    }
  };

  const autoCategorize = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('knowledgeAI', {
        action: 'categorize',
        content: article.content,
      });
      
      await base44.entities.KnowledgeBase.update(article.id, {
        category: data.category,
        tags: data.tags,
      });
      
      onUpdate();
      toast.success('Article categorized');
    } catch (e) {
      toast.error('Failed to categorize');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={generateSummary}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
          <span className="ml-2">Summarize</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={findRelated}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
          <span className="ml-2">Find Related</span>
        </Button>

        {(!article.category || article.tags?.length === 0) && (
          <Button
            variant="outline"
            size="sm"
            onClick={autoCategorize}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            <span className="ml-2">Auto-Categorize</span>
          </Button>
        )}
      </div>

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI-Generated Summary</DialogTitle>
            <DialogDescription>{article.title}</DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-700">{summary}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Related Articles Dialog */}
      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Related Articles</DialogTitle>
            <DialogDescription>AI-suggested connections</DialogDescription>
          </DialogHeader>
          {suggestions && suggestions.length > 0 ? (
            <div className="space-y-2">
              {suggestions.map((article, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <p className="font-medium text-sm text-slate-900">{article.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{article.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No related articles found</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}