import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { History, RotateCcw, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import moment from 'moment';

export default function ArticleVersionHistory({ article, onRestore }) {
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['article-versions', article.id],
    queryFn: () => base44.entities.KnowledgeVersion.filter(
      { article_id: article.id },
      '-version_number'
    ),
    enabled: !!article.id
  });

  const restoreMutation = useMutation({
    mutationFn: async (version) => {
      // Update article with version content
      await base44.entities.KnowledgeBase.update(article.id, {
        title: version.title,
        content: version.content
      });

      // Create new version for the restoration
      const maxVersion = Math.max(...versions.map(v => v.version_number), 0);
      await base44.entities.KnowledgeVersion.create({
        org_id: article.org_id,
        article_id: article.id,
        version_number: maxVersion + 1,
        title: version.title,
        content: version.content,
        change_summary: `Restored from version ${version.version_number}`,
        changed_by: (await base44.auth.me()).email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      queryClient.invalidateQueries({ queryKey: ['article-versions'] });
      toast.success('Version restored');
      onRestore?.();
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Version History ({versions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {versions.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No version history yet
          </p>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex items-start justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      v{version.version_number}
                    </Badge>
                    <span className="text-sm font-medium text-slate-900">
                      {version.title}
                    </span>
                  </div>
                  {version.change_summary && (
                    <p className="text-xs text-slate-600 mb-1">
                      {version.change_summary}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {moment(version.created_date).fromNow()}
                    </span>
                    <span>by {version.changed_by}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => restoreMutation.mutate(version)}
                  disabled={restoreMutation.isPending}
                  className="ml-2"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}