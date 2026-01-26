import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Book, Sparkles, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SuggestedArticles({ query, orgId }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query || !orgId) return;
      
      setLoading(true);
      try {
        const { data } = await base44.functions.invoke('knowledgeAI', {
          action: 'suggest_related',
          query,
          org_id: orgId,
        });
        setSuggestions(data.suggestions || []);
      } catch (e) {
        console.error('Failed to fetch suggestions:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [query, orgId]);

  if (loading) {
    return (
      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
            Finding related knowledge...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Book className="h-4 w-4 text-purple-600" />
          Related Knowledge Articles
        </CardTitle>
        <CardDescription className="text-xs">
          AI found these relevant articles from your knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.map((article, idx) => (
          <div key={idx} className="p-3 bg-white rounded-lg border border-purple-100 hover:border-purple-300 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-900">{article.title}</p>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{article.content}</p>
                {article.tags?.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {article.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <ExternalLink className="h-4 w-4 text-slate-400 flex-shrink-0" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}