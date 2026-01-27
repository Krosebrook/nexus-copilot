import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, org_id, limit = 10 } = await req.json();

    if (!query || !org_id) {
      return Response.json({ error: 'Missing query or org_id' }, { status: 400 });
    }

    // Get all active knowledge articles
    const articles = await base44.entities.KnowledgeBase.filter({
      org_id,
      is_active: true
    });

    if (articles.length === 0) {
      return Response.json({ results: [] });
    }

    // Use AI to find semantically similar articles
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Given the search query: "${query}"

Analyze these knowledge base articles and rank them by relevance (0-100 score):

${articles.map((article, idx) => `
[${idx}] ${article.title}
${article.content?.substring(0, 300)}...
Tags: ${article.tags?.join(', ') || 'none'}
Category: ${article.category || 'none'}
`).join('\n')}

Return the top ${limit} most relevant articles with relevance scores. Consider:
- Semantic similarity (meaning, not just keywords)
- Context and intent
- Tags and categories
- Content depth

Return only articles with score > 30.`,
      response_json_schema: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                article_index: { type: 'number' },
                relevance_score: { type: 'number' },
                relevance_reason: { type: 'string' }
              }
            }
          }
        }
      }
    });

    // Map results back to full articles
    const rankedArticles = response.results
      .filter(r => r.relevance_score > 30)
      .map(result => ({
        ...articles[result.article_index],
        relevance_score: result.relevance_score,
        relevance_reason: result.relevance_reason
      }))
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);

    return Response.json({ results: rankedArticles });
  } catch (error) {
    console.error('Semantic search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});