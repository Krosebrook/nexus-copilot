import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, FileText, CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function KnowledgeUpload() {
  const [orgId, setOrgId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [files, setFiles] = useState([]); // { file, status: 'pending'|'uploading'|'done'|'error', name, category }
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const user = await base44.auth.me();
      setUserEmail(user.email);
      const memberships = await base44.entities.Membership.filter({ user_email: user.email, status: 'active' });
      if (memberships.length > 0) setOrgId(memberships[0].org_id);
    };
    init();
  }, []);

  const addFiles = (incoming) => {
    const allowed = Array.from(incoming).filter(f =>
      f.type === 'application/pdf' || f.type === 'text/plain' || f.name.endsWith('.txt') || f.name.endsWith('.pdf')
    );
    if (allowed.length < incoming.length) toast.warning('Only PDF and TXT files are supported.');
    setFiles(prev => [
      ...prev,
      ...allowed.map(f => ({ file: f, status: 'pending', name: f.name, category: '' }))
    ]);
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const updateCategory = (idx, category) => {
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, category } : f));
  };

  const processFile = async (idx) => {
    if (!orgId) { toast.error('Organization not found'); return; }
    const entry = files[idx];

    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'uploading' } : f));

    const { file_url } = await base44.integrations.Core.UploadFile({ file: entry.file });

    const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    if (extracted.status !== 'success' || !extracted.output) {
      setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'error' } : f));
      toast.error(`Failed to parse ${entry.name}`);
      return;
    }

    const { title, content, tags } = extracted.output;

    await base44.entities.KnowledgeBase.create({
      org_id: orgId,
      title: title || entry.name.replace(/\.[^.]+$/, ''),
      content: content || '',
      source_type: 'upload',
      file_url,
      category: entry.category || 'General',
      tags: tags || [],
      is_active: true,
      usage_count: 0,
    });

    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'done' } : f));
    toast.success(`"${title || entry.name}" added to Knowledge Base`);

    await base44.entities.AuditLog.create({
      org_id: orgId,
      actor_email: userEmail,
      action: 'knowledge_uploaded',
      action_category: 'data',
      resource_type: 'KnowledgeBase',
      status: 'success',
    });
  };

  const processAll = async () => {
    const pending = files.map((f, i) => ({ ...f, idx: i })).filter(f => f.status === 'pending');
    for (const { idx } of pending) {
      await processFile(idx);
    }
  };

  const hasPending = files.some(f => f.status === 'pending');

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upload Documents</h1>
        <p className="text-sm text-slate-500 mt-1">Upload PDF or text files to automatically create Knowledge Base entries for your organization.</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          dragging ? 'border-slate-500 bg-slate-50' : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
        }`}
      >
        <Upload className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700">Drag & drop files here, or click to select</p>
        <p className="text-xs text-slate-400 mt-1">PDF and TXT files supported</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,application/pdf,text/plain"
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {files.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <FileText className="h-5 w-5 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{entry.name}</p>
                  <Input
                    placeholder="Category (optional)"
                    value={entry.category}
                    onChange={e => updateCategory(idx, e.target.value)}
                    disabled={entry.status !== 'pending'}
                    className="h-7 text-xs mt-1.5"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {entry.status === 'pending' && (
                    <>
                      <Button size="sm" className="h-7 text-xs" onClick={() => processFile(idx)} disabled={!orgId}>
                        Upload
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => removeFile(idx)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {entry.status === 'uploading' && <Loader2 className="h-5 w-5 text-slate-500 animate-spin" />}
                  {entry.status === 'done' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {entry.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                </div>
              </div>
            ))}

            {hasPending && (
              <Button className="w-full" onClick={processAll} disabled={!orgId}>
                Upload All Pending
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}