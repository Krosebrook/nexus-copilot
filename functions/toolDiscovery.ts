import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Autonomous tool discovery and selection for AI agents
 * Analyzes task requirements and recommends best-fit tools
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { org_id, task_description, agent_id, step_context } = await req.json();

    if (!org_id || !task_description) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get all available tools
    const tools = await base44.asServiceRole.entities.ToolRegistry.filter({ 
      org_id, 
      is_active: true 
    });

    if (tools.length === 0) {
      return Response.json({ 
        recommended_tools: [],
        message: 'No tools available in registry'
      });
    }

    // Use LLM to analyze task and match with tools
    const toolDescriptions = tools.map(t => 
      `- ${t.tool_id}: ${t.name} (${t.category}) - ${t.description} - Success rate: ${t.success_rate}%`
    ).join('\n');

    const matchingPrompt = `You are a tool selection expert. Analyze the following task and recommend the most appropriate tools from the registry.

Task: ${task_description}
${step_context ? `Context: ${JSON.stringify(step_context)}` : ''}

Available Tools:
${toolDescriptions}

Select 1-3 tools that are most suitable for this task. Consider:
1. Tool functionality match
2. Historical success rate
3. Category relevance

Return your recommendation as a ranked list.`;

    const recommendation = await base44.integrations.Core.InvokeLLM({
      prompt: matchingPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tool_id: { type: 'string' },
                confidence: { type: 'number' },
                reasoning: { type: 'string' },
                fallback_tools: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        }
      }
    });

    // Enrich recommendations with tool details and credential status
    const enrichedRecommendations = await Promise.all(
      recommendation.recommendations.map(async (rec) => {
        const tool = tools.find(t => t.tool_id === rec.tool_id);
        if (!tool) return null;

        // Check credential availability
        let credentialStatus = 'not_required';
        if (tool.requires_credentials) {
          const credentials = await base44.asServiceRole.entities.ToolCredential.filter({
            org_id,
            tool_id: tool.tool_id,
            is_active: true
          });
          credentialStatus = credentials.length > 0 ? 'available' : 'missing';
        }

        return {
          ...rec,
          tool_details: tool,
          credential_status: credentialStatus,
          can_execute: credentialStatus !== 'missing'
        };
      })
    );

    return Response.json({
      task_description,
      recommended_tools: enrichedRecommendations.filter(r => r !== null),
      total_available_tools: tools.length,
      analyzed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Tool discovery error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});