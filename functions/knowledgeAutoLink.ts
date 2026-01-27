import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { article_id, org_id } = await req.json();

    if (!article_id || !org_id) {
      return Response.json({ error: 'Missing article_id or org_id' }, { status: 400 });
    }

    // Get the current article
    const articles = await base44.entities.KnowledgeBase.filter({ id: article_id });
    if (articles.length === 0) {
      return Response.json({ error: 'Article not found' }, { status: 404 });
    }
    const currentArticle = articles[0];

    // Get all other articles in the org
    const allArticles = await base44.entities.KnowledgeBase.filter({
      org_id,
      is_active: true
    });

    const otherArticles = allArticles.filter(a => a.id !== article_id);

    if (otherArticles.length === 0) {
      return Response.json({ suggestions: [] });
    }

    // Use AI to find related articles
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this knowledge base article and suggest related articles to link:

CURRENT ARTICLE:
Title: ${currentArticle.title}
Content: ${currentArticle.content}
Tags: ${currentArticle.tags?.join(', ') || 'none'}
Category: ${currentArticle.category || 'none'}

OTHER ARTICLES:
${otherArticles.map((article, idx) => `
[${idx}] ${article.title}
${article.content?.substring(0, 200)}...
Tags: ${article.tags?.join(', ') || 'none'}
Category: ${article.category || 'none'}
`).join('\n')}

Suggest up to 5 articles that should be linked because they:
- Cover related topics
- Provide complementary information
- Are frequently referenced together
- Share similar concepts

Return only highly relevant suggestions (score > 60).`,
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                article_index: { type: 'number' },
                relevance_score: { type: 'number' },
                link_reason: { type: 'string' }
              }
            }
          }
        }
      }
    });

    // Map suggestions back to full articles
    const linkedSuggestions = response.suggestions
      .filter(s => s.relevance_score > 60)
      .map(suggestion => ({
        ...otherArticles[suggestion.article_index],
        relevance_score: suggestion.relevance_score,
        link_reason: suggestion.link_reason
      }))
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 5);

    return Response.json({ suggestions: linkedSuggestions });
  } catch (error) {
    console.error('Auto-link error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});