import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Send, Loader2, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from 'react-markdown';
import { toast } from "sonner";

export default function KnowledgeAssistant({ orgId, onArticleClick }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const response = await base44.functions.invoke('knowledgeAssistant', {
        question,
        org_id: orgId
      });

      setAnswer(response.data);
    } catch (error) {
      console.error('Assistant error:', error);
      toast.error('Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg">Knowledge Assistant</CardTitle>
        </div>
        <p className="text-sm text-slate-600">
          Ask questions and I'll answer using your knowledge base
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask a question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            disabled={loading}
          />
          <Button
            onClick={handleAsk}
            disabled={loading || !question.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {answer && (
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <ReactMarkdown className="prose prose-sm max-w-none">
                {answer.answer}
              </ReactMarkdown>
            </div>

            {answer.sources?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-700 mb-2">
                  Sources ({answer.sources.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {answer.sources.map((source) => (
                    <Badge
                      key={source.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-purple-50"
                      onClick={() => onArticleClick?.(source.id)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {source.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {answer.confidence && (
              <p className="text-xs text-slate-500">
                Confidence: {Math.round(answer.confidence)}%
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}