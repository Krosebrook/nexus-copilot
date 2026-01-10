import React, { useState } from 'react';
import { Link as LinkIcon, Search, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ArticleLinkSelector({ 
  allArticles, 
  currentArticleId, 
  selectedLinks = [], 
  onLinksChange 
}) {
  const [search, setSearch] = useState('');

  const availableArticles = allArticles.filter(a => 
    a.id !== currentArticleId && 
    !selectedLinks.includes(a.id) &&
    (search === '' || a.title.toLowerCase().includes(search.toLowerCase()))
  );

  const addLink = (articleId) => {
    onLinksChange([...selectedLinks, articleId]);
    setSearch('');
  };

  const removeLink = (articleId) => {
    onLinksChange(selectedLinks.filter(id => id !== articleId));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <LinkIcon className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">Linked Articles</span>
      </div>

      {/* Selected Links */}
      {selectedLinks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLinks.map(linkId => {
            const article = allArticles.find(a => a.id === linkId);
            return article ? (
              <Badge key={linkId} variant="secondary" className="cursor-pointer" onClick={() => removeLink(linkId)}>
                {article.title}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ) : null;
          })}
        </div>
      )}

      {/* Search & Add */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Search articles to link..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {search && availableArticles.length > 0 && (
          <ScrollArea className="h-40 border border-slate-200 rounded-lg">
            <div className="p-2 space-y-1">
              {availableArticles.slice(0, 10).map(article => (
                <button
                  key={article.id}
                  onClick={() => addLink(article.id)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 text-sm"
                >
                  <p className="font-medium text-slate-900">{article.title}</p>
                  {article.category && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {article.category}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}