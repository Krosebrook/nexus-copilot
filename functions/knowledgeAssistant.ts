import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, org_id, category_filter } = await req.json();

    if (!question || !org_id) {
      return Response.json({ error: 'Missing question or org_id' }, { status: 400 });
    }

    // Get relevant knowledge articles
    const filterCriteria = { org_id, is_active: true };
    if (category_filter) {
      filterCriteria.category = category_filter;
    }

    const articles = await base44.entities.KnowledgeBase.filter(filterCriteria);

    if (articles.length === 0) {
      return Response.json({
        answer: "I don't have any knowledge articles to reference yet. Please add some articles to the knowledge base first.",
        sources: []
      });
    }

    // Create knowledge context
    const knowledgeContext = articles.map(article => `
**${article.title}** (${article.category || 'General'})
${article.content}
---
`).join('\n');

    // Use AI to answer the question
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a helpful knowledge base assistant. Answer the user's question using ONLY the information from the provided knowledge articles.

KNOWLEDGE BASE:
${knowledgeContext}

USER QUESTION: ${question}

Rules:
1. Answer accurately based on the knowledge articles
2. Cite which articles you used
3. If the information isn't in the knowledge base, say so clearly
4. Be concise but thorough
5. Format your answer in markdown

Provide your answer and list the article IDs you referenced.`,
      response_json_schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          referenced_article_indices: {
            type: 'array',
            items: { type: 'number' }
          },
          confidence: { type: 'number' }
        }
      }
    });

    // Map referenced articles
    const sourcedArticles = response.referenced_article_indices
      ?.map(idx => articles[idx])
      .filter(a => a)
      .map(article => ({
        id: article.id,
        title: article.title,
        category: article.category
      })) || [];

    return Response.json({
      answer: response.answer,
      sources: sourcedArticles,
      confidence: response.confidence
    });
  } catch (error) {
    console.error('Knowledge assistant error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});