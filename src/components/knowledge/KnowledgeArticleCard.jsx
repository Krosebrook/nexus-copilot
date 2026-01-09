import React from 'react';
import { format } from 'date-fns';
import { ExternalLink, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CATEGORY_COLORS = {
  guide: 'bg-blue-100 text-blue-700 border-blue-200',
  tutorial: 'bg-green-100 text-green-700 border-green-200',
  reference: 'bg-purple-100 text-purple-700 border-purple-200',
  faq: 'bg-amber-100 text-amber-700 border-amber-200',
  policy: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function KnowledgeArticleCard({ article, onEdit, onToggle, onDelete }) {
  return (
    <Card className={article.is_active ? '' : 'opacity-60'}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-2">{article.title}</h3>
            <div className="flex flex-wrap gap-2">
              {article.category && (
                <Badge variant="outline" className={CATEGORY_COLORS[article.category]}>
                  {article.category}
                </Badge>
              )}
              {article.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle(article)}
              className="h-8 w-8 p-0"
            >
              {article.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(article)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(article)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 line-clamp-3 mb-3">
          {article.content}
        </p>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>Updated {format(new Date(article.updated_date), 'MMM d, yyyy')}</span>
          {article.usage_count > 0 && <span>Used {article.usage_count} times</span>}
          {article.source_url && (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Source
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}