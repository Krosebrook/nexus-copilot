import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Book, Plus, Link as LinkIcon, FileText, 
  MoreHorizontal, Trash2, Loader2, Network, Edit, Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KnowledgeGraph from '@/components/knowledge/KnowledgeGraph';
import PermissionGuard, { usePermissions } from '@/components/rbac/PermissionGuard';
import AIEnhancementsPanel from '@/components/knowledge/AIEnhancementsPanel';
import ArticleEditor from '@/components/knowledge/ArticleEditor';
import ArticleActions from '@/components/knowledge/ArticleActions';

export default function Knowledge() {
  const { can, role } = usePermissions();
  const [currentOrg, setCurrentOrg] = useState(null);
  const [user, setUser] = useState(null);
  const [addDialog, setAddDialog] = useState({ open: false, type: 'manual' });
  const [editingArticle, setEditingArticle] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'graph', 'ai'
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    source_url: '',
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        const memberships = await base44.entities.Membership.filter({ 
          user_email: userData.email, 
          status: 'active' 
        });
        if (memberships.length > 0) {
          const orgs = await base44.entities.Organization.filter({ id: memberships[0].org_id });
          if (orgs.length > 0) setCurrentOrg(orgs[0]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const { data: knowledgeBase = [], isLoading } = useQuery({
    queryKey: ['knowledge', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.KnowledgeBase.filter({ org_id: currentOrg.id }, '-created_date') : [],
    enabled: !!currentOrg,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      try {
        await base44.entities.KnowledgeBase.update(id, data);

        // Update backlinks if linked_articles changed
        if (data.linked_articles) {
          const oldLinks = editingArticle?.linked_articles || [];
          const newLinks = data.linked_articles;
          
          // Add backlinks to newly linked articles
          const added = newLinks.filter(l => !oldLinks.includes(l));
          for (const linkId of added) {
            const targetArticle = knowledgeBase.find(a => a.id === linkId);
            if (targetArticle) {
              const updatedBacklinks = [...new Set([...(targetArticle.backlinks || []), id])];
              await base44.entities.KnowledgeBase.update(linkId, { backlinks: updatedBacklinks });
            }
          }

          // Remove backlinks from unlinked articles
          const removed = oldLinks.filter(l => !newLinks.includes(l));
          for (const linkId of removed) {
            const targetArticle = knowledgeBase.find(a => a.id === linkId);
            if (targetArticle) {
              const updatedBacklinks = (targetArticle.backlinks || []).filter(b => b !== id);
              await base44.entities.KnowledgeBase.update(linkId, { backlinks: updatedBacklinks });
            }
          }
        }

        await base44.entities.AuditLog.create({
          org_id: currentOrg.id,
          actor_email: user.email,
          action: 'knowledge_updated',
          action_category: 'data',
          resource_type: 'KnowledgeBase',
          resource_id: id,
          status: 'success',
        });
      } catch (error) {
        await base44.entities.AuditLog.create({
          org_id: currentOrg.id,
          actor_email: user.email,
          action: 'knowledge_update_failed',
          action_category: 'data',
          resource_type: 'KnowledgeBase',
          resource_id: id,
          status: 'failure',
          details: { error: error.message },
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Article updated successfully');
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      setEditingArticle(null);
    },
    onError: (error) => {
      toast.error('Failed to update article: ' + (error.message || 'Unknown error'));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      let fileUrl = null;
      let extractedContent = formData.content;

      // Handle file upload
      if (uploadFile) {
        setUploading(true);
        const uploadResult = await base44.integrations.Core.UploadFile({ file: uploadFile });
        fileUrl = uploadResult.file_url;

        // Extract content from file
        try {
          const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
            file_url: fileUrl,
            json_schema: {
              type: "object",
              properties: {
                text_content: { type: "string" }
              }
            }
          });
          if (extractResult.status === 'success' && extractResult.output?.text_content) {
            extractedContent = extractResult.output.text_content.slice(0, 10000);
          }
        } catch (e) {
          console.log('Could not extract text, using description');
        }
        setUploading(false);
      }

      const kb = await base44.entities.KnowledgeBase.create({
        org_id: currentOrg.id,
        title: data.title,
        content: extractedContent,
        source_type: addDialog.type,
        source_url: data.source_url || undefined,
        file_url: fileUrl || undefined,
        category: data.category || undefined,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        is_active: true,
        linked_articles: data.linked_articles || [],
        parent_article_id: data.parent_article_id || undefined,
      });

      // Add backlinks to linked articles (prevent duplicates)
      if (data.linked_articles?.length > 0) {
        for (const linkId of data.linked_articles) {
          const targetArticle = knowledgeBase.find(a => a.id === linkId);
          if (targetArticle) {
            const updatedBacklinks = [...new Set([...(targetArticle.backlinks || []), kb.id])];
            await base44.entities.KnowledgeBase.update(linkId, { backlinks: updatedBacklinks });
          }
        }
      }

      await base44.entities.AuditLog.create({
        org_id: currentOrg.id,
        actor_email: user.email,
        action: 'knowledge_added',
        action_category: 'data',
        resource_type: 'KnowledgeBase',
        resource_id: kb.id,
        status: 'success',
      });

      return kb;
    },
    onSuccess: () => {
      toast.success('Knowledge added');
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      setAddDialog({ open: false, type: 'manual' });
      setFormData({ title: '', content: '', category: '', tags: '', source_url: '' });
      setUploadFile(null);
    },
    onError: () => {
      toast.error('Failed to add knowledge');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (kb) => {
      await base44.entities.KnowledgeBase.update(kb.id, { is_active: !kb.is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (kb) => {
      // Remove backlinks from articles that link to this one
      if (kb.backlinks?.length > 0) {
        for (const backlinkId of kb.backlinks) {
          const article = knowledgeBase.find(a => a.id === backlinkId);
          if (article) {
            const updatedLinks = (article.linked_articles || []).filter(l => l !== kb.id);
            await base44.entities.KnowledgeBase.update(backlinkId, { linked_articles: updatedLinks });
          }
        }
      }

      // Remove this article from linked articles' backlinks
      if (kb.linked_articles?.length > 0) {
        for (const linkId of kb.linked_articles) {
          const article = knowledgeBase.find(a => a.id === linkId);
          if (article) {
            const updatedBacklinks = (article.backlinks || []).filter(b => b !== kb.id);
            await base44.entities.KnowledgeBase.update(linkId, { backlinks: updatedBacklinks });
          }
        }
      }

      await base44.entities.KnowledgeBase.delete(kb.id);
    },
    onSuccess: () => {
      toast.success('Knowledge deleted');
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || (!formData.content && !uploadFile)) {
      toast.error('Title and content are required');
      return;
    }
    createMutation.mutate(formData);
  };

  const activeCount = knowledgeBase.filter(kb => kb.is_active).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Book className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Knowledge Base</h1>
              <p className="text-sm text-slate-500">Train your Copilot with organization-specific knowledge</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-white">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
              <Button
                variant={viewMode === 'graph' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('graph')}
              >
                <Network className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'ai' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('ai')}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
            <PermissionGuard permission="create_knowledge">
              <Button onClick={() => setAddDialog({ open: true, type: 'manual' })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Knowledge
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {activeCount > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-700">
              <strong>{activeCount}</strong> active document{activeCount !== 1 ? 's' : ''} available to Copilot
            </p>
          </div>
        )}

        {viewMode === 'ai' ? (
          <AIEnhancementsPanel orgId={currentOrg?.id} articles={knowledgeBase} />
        ) : viewMode === 'graph' && knowledgeBase.length > 0 ? (
          <div className="mb-6">
            <KnowledgeGraph 
              articles={knowledgeBase}
              onArticleClick={(id) => {
                const article = knowledgeBase.find(a => a.id === id);
                if (article) setEditingArticle(article);
              }}
            />
          </div>
        ) : null}

        {viewMode === 'list' && (isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : knowledgeBase.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <Book className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-2">No knowledge base yet</p>
            <p className="text-sm text-slate-400 mb-4">Add documents to train your Copilot</p>
            <Button onClick={() => setAddDialog({ open: true, type: 'manual' })}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Document
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {knowledgeBase.map((kb) => (
              <div key={kb.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-slate-900">{kb.title}</h3>
                      {kb.category && (
                        <Badge variant="outline" className="text-xs">{kb.category}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-2">{kb.content}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>Added {format(new Date(kb.created_date), 'MMM d, yyyy')}</span>
                      {kb.usage_count > 0 && (
                        <span>Used {kb.usage_count} time{kb.usage_count !== 1 ? 's' : ''}</span>
                      )}
                      {kb.source_type === 'upload' && (
                        <Badge variant="secondary" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          File
                        </Badge>
                      )}
                      {kb.source_url && (
                        <a href={kb.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                          <LinkIcon className="h-3 w-3" />
                          Source
                        </a>
                      )}
                    </div>
                    {kb.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {kb.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <ArticleActions
                        article={kb}
                        allArticles={knowledgeBase}
                        onUpdate={() => queryClient.invalidateQueries({ queryKey: ['knowledge'] })}
                      />
                    </div>
                    {(kb.linked_articles?.length > 0 || kb.backlinks?.length > 0) && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500">
                          <LinkIcon className="h-3 w-3 inline mr-1" />
                          {kb.linked_articles?.length || 0} outgoing, {kb.backlinks?.length || 0} incoming links
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={kb.is_active}
                      onCheckedChange={() => toggleActiveMutation.mutate(kb)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingArticle(kb)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteMutation.mutate(kb)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        <Dialog open={addDialog.open} onOpenChange={(open) => !open && setAddDialog({ open: false, type: 'manual' })}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Knowledge</DialogTitle>
              <DialogDescription>
                Add documents, links, or content to train your Copilot
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={addDialog.type} onValueChange={(value) => setAddDialog({ ...addDialog, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                    <SelectItem value="upload">Upload File</SelectItem>
                    <SelectItem value="url">Link URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Product Requirements Document"
                />
              </div>

              {addDialog.type === 'upload' && (
                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <Input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    accept=".pdf,.txt,.md,.doc,.docx"
                  />
                  <p className="text-xs text-slate-500">PDF, TXT, MD, DOC supported</p>
                </div>
              )}

              {addDialog.type === 'url' && (
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={formData.source_url}
                    onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Paste or describe the content..."
                  rows={6}
                  disabled={addDialog.type === 'upload' && uploadFile}
                />
                {addDialog.type === 'upload' && uploadFile && (
                  <p className="text-xs text-slate-500">Content will be extracted from file</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Product, Engineering"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Comma separated"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialog({ open: false, type: 'manual' })}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || uploading}>
                  {(createMutation.isPending || uploading) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {uploading ? 'Uploading...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Knowledge
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {editingArticle && (
          <ArticleEditor
            article={editingArticle}
            allArticles={knowledgeBase}
            onSave={(data) => updateMutation.mutate({ id: editingArticle.id, data })}
            onCancel={() => setEditingArticle(null)}
          />
        )}
      </div>
    </div>
  );
}