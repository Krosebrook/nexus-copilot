import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { event, data, old_data } = await req.json();

    // Only process updates
    if (event.type !== 'update' || !data || !old_data) {
      return Response.json({ skipped: true });
    }

    // Check if content or title actually changed
    if (data.title === old_data.title && data.content === old_data.content) {
      return Response.json({ skipped: true, reason: 'no_content_change' });
    }

    // Get existing versions
    const versions = await base44.asServiceRole.entities.KnowledgeVersion.filter({ 
      article_id: data.id 
    });
    
    const maxVersion = Math.max(...versions.map(v => v.version_number), 0);

    // Create new version
    await base44.asServiceRole.entities.KnowledgeVersion.create({
      org_id: data.org_id,
      article_id: data.id,
      version_number: maxVersion + 1,
      title: data.title,
      content: data.content,
      change_summary: 'Article updated',
      changed_by: data.updated_by || 'system'
    });

    return Response.json({ 
      success: true, 
      version: maxVersion + 1 
    });

  } catch (error) {
    console.error('Version save error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});