import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, FileText, Link2, Copy, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

export default function AIEnhancementsPanel({ orgId, articles }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [duplicates, setDuplicates] = useState(null);
  const [outdated, setOutdated] = useState(null);

  const analyzeDuplicates = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('knowledgeAI', {
        action: 'find_duplicates',
        org_id: orgId,
      });
      setDuplicates(data.duplicate_groups || []);
      toast.success('Analysis complete');
    } catch (e) {
      toast.error('Failed to analyze duplicates');
    } finally {
      setLoading(false);
    }
  };

  const findOutdated = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('knowledgeAI', {
        action: 'find_outdated',
        org_id: orgId,
      });
      setOutdated(data.outdated_articles || []);
      toast.success('Analysis complete');
    } catch (e) {
      toast.error('Failed to find outdated articles');
    } finally {
      setLoading(false);
    }
  };

  const autoCategorizeSingle = async (article) => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('knowledgeAI', {
        action: 'categorize',
        article_id: article.id,
        content: article.content,
      });
      
      await base44.entities.KnowledgeBase.update(article.id, {
        category: data.category,
        tags: data.tags,
      });
      
      toast.success(`Categorized as "${data.category}" with ${data.tags.length} tags`);
    } catch (e) {
      toast.error('Failed to categorize');
    } finally {
      setLoading(false);
    }
  };

  const autoCategorizeAll = async () => {
    const uncategorized = articles.filter(a => !a.category || a.tags?.length === 0);
    if (uncategorized.length === 0) {
      toast.info('All articles are already categorized');
      return;
    }

    setLoading(true);
    let success = 0;
    try {
      for (const article of uncategorized.slice(0, 10)) {
        try {
          const { data } = await base44.functions.invoke('knowledgeAI', {
            action: 'categorize',
            content: article.content,
          });
          
          await base44.entities.KnowledgeBase.update(article.id, {
            category: data.category,
            tags: data.tags,
          });
          success++;
        } catch (e) {
          console.error('Failed to categorize article:', article.id);
        }
      }
      toast.success(`Categorized ${success} articles`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold text-slate-900">AI Enhancements</h3>
      </div>

      <Tabs defaultValue="duplicates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
          <TabsTrigger value="outdated">Outdated</TabsTrigger>
          <TabsTrigger value="categorize">Categorize</TabsTrigger>
        </TabsList>

        <TabsContent value="duplicates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Find Duplicate Articles</CardTitle>
              <CardDescription>
                AI will identify similar or duplicate content across your knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={analyzeDuplicates} disabled={loading}>
                {loading ? 'Analyzing...' : 'Analyze Duplicates'}
              </Button>

              {duplicates && duplicates.length > 0 && (
                <div className="mt-4 space-y-3">
                  {duplicates.map((group, i) => (
                    <div key={i} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Copy className="h-4 w-4 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-900">
                            {group.article_ids?.length || 0} Similar Articles
                          </p>
                          <p className="text-xs text-orange-700 mt-1">{group.similarity_reason}</p>
                          <div className="flex gap-2 mt-2">
                            {group.article_ids?.map(id => {
                              const article = articles.find(a => a.id === id);
                              return article ? (
                                <Badge key={id} variant="outline" className="text-xs">
                                  {article.title}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {duplicates && duplicates.length === 0 && (
                <p className="text-sm text-slate-500 mt-4">No duplicates found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outdated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Find Outdated Articles</CardTitle>
              <CardDescription>
                AI will identify articles that may need updating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={findOutdated} disabled={loading}>
                {loading ? 'Analyzing...' : 'Find Outdated'}
              </Button>

              {outdated && outdated.length > 0 && (
                <div className="mt-4 space-y-3">
                  {outdated.map((item, i) => {
                    const article = articles.find(a => a.id === item.article_id);
                    return (
                      <div key={i} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-yellow-900">
                              {article?.title || 'Unknown Article'}
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">{item.reason}</p>
                            <Badge variant="outline" className="mt-2 text-xs capitalize">
                              {item.confidence} confidence
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {outdated && outdated.length === 0 && (
                <p className="text-sm text-slate-500 mt-4">No outdated articles found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Auto-Categorize Articles</CardTitle>
              <CardDescription>
                Let AI suggest categories and tags for uncategorized articles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {articles.filter(a => !a.category || a.tags?.length === 0).length > 0 && (
                <Button onClick={autoCategorizeAll} disabled={loading} className="w-full">
                  {loading ? 'Categorizing...' : `Auto-Categorize All (${articles.filter(a => !a.category || a.tags?.length === 0).length})`}
                </Button>
              )}

              <div className="space-y-2">
                {articles.filter(a => !a.category || a.tags?.length === 0).slice(0, 10).map(article => (
                  <div key={article.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{article.title}</p>
                      <p className="text-xs text-slate-500">No category or tags</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => autoCategorizeSingle(article)}
                      disabled={loading}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Categorize
                    </Button>
                  </div>
                ))}
                
                {articles.filter(a => !a.category || a.tags?.length === 0).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500">All articles are categorized! 🎉</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}