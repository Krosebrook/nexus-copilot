import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, article_id, content, query, org_id } = await req.json();

    switch (action) {
      case 'categorize':
        // Auto-categorize article based on content
        const categoryResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this knowledge article and suggest the most appropriate category and tags.

Content: ${content}

Return a JSON with the category (one of: process, policy, technical, product, general) and 3-5 relevant tags.`,
          response_json_schema: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
            },
          },
        });

        return Response.json(categoryResult);

      case 'summarize':
        // Generate summary of long article
        const summaryResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Create a concise 2-3 sentence summary of this knowledge article:

${content}

Focus on the key takeaways and main points.`,
        });

        return Response.json({ summary: summaryResult });

      case 'suggest_related':
        // Suggest related articles based on query or content
        const articles = await base44.entities.KnowledgeBase.filter({ 
          org_id, 
          is_active: true 
        });

        const suggestionResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Given this query or context: "${query || content}"

And these available articles:
${articles.map((a, i) => `${i + 1}. ${a.title} - ${a.content.substring(0, 200)}...`).join('\n')}

Suggest the 3 most relevant article IDs (return array of indices, 1-based).`,
          response_json_schema: {
            type: 'object',
            properties: {
              suggested_indices: { type: 'array', items: { type: 'number' } },
              reasoning: { type: 'string' },
            },
          },
        });

        const suggested = suggestionResult.suggested_indices
          .filter(i => i > 0 && i <= articles.length)
          .map(i => articles[i - 1]);

        return Response.json({ 
          suggestions: suggested,
          reasoning: suggestionResult.reasoning 
        });

      case 'find_duplicates':
        // Identify potential duplicate or similar articles
        const allArticles = await base44.entities.KnowledgeBase.filter({ 
          org_id, 
          is_active: true 
        });

        const duplicateResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze these knowledge articles and identify potential duplicates or very similar content:

${allArticles.map((a, i) => `${i + 1}. [${a.id}] ${a.title}\n${a.content.substring(0, 300)}...\n`).join('\n')}

Return groups of duplicate/similar articles (array of arrays of article IDs).`,
          response_json_schema: {
            type: 'object',
            properties: {
              duplicate_groups: { 
                type: 'array', 
                items: { 
                  type: 'object',
                  properties: {
                    article_ids: { type: 'array', items: { type: 'string' } },
                    similarity_reason: { type: 'string' }
                  }
                }
              },
            },
          },
        });

        return Response.json(duplicateResult);

      case 'find_outdated':
        // Identify potentially outdated articles
        const articlesToCheck = await base44.entities.KnowledgeBase.filter({ 
          org_id, 
          is_active: true 
        });

        const outdatedResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Review these knowledge articles and identify any that might be outdated based on:
- Mentions of old dates, years, or versions
- References to deprecated tools or processes
- Language suggesting temporary information

Articles:
${articlesToCheck.map((a, i) => `${i + 1}. [${a.id}] ${a.title}\nCreated: ${a.created_date}\n${a.content.substring(0, 200)}...\n`).join('\n')}

Return article IDs that might be outdated with reasons.`,
          response_json_schema: {
            type: 'object',
            properties: {
              outdated_articles: { 
                type: 'array', 
                items: { 
                  type: 'object',
                  properties: {
                    article_id: { type: 'string' },
                    reason: { type: 'string' },
                    confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
                  }
                }
              },
            },
          },
        });

        return Response.json(outdatedResult);

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});