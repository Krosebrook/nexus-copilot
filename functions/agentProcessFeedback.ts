import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      agent_id, 
      execution_id, 
      feedback_type, 
      rating, 
      was_helpful, 
      corrections = [], 
      comment,
      org_id 
    } = await req.json();

    // Get agent and execution
    const agents = await base44.asServiceRole.entities.Agent.filter({ id: agent_id });
    if (agents.length === 0) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }
    const agent = agents[0];

    const executions = await base44.asServiceRole.entities.AgentExecution.filter({ id: execution_id });
    if (executions.length === 0) {
      return Response.json({ error: 'Execution not found' }, { status: 404 });
    }
    const execution = executions[0];

    // Store feedback
    const feedback = await base44.asServiceRole.entities.AgentFeedback.create({
      org_id,
      agent_id,
      execution_id,
      user_email: user.email,
      feedback_type,
      rating: rating || undefined,
      was_helpful: was_helpful !== undefined ? was_helpful : undefined,
      corrections: corrections.length > 0 ? corrections : undefined,
      comment: comment || undefined,
      task_context: execution.task,
      applied_to_learning: false
    });

    // Update execution with feedback
    await base44.asServiceRole.entities.AgentExecution.update(execution_id, {
      user_feedback: {
        rating,
        helpful: was_helpful,
        comment,
        corrections: corrections.length > 0 ? corrections : undefined
      }
    });

    // Process feedback for learning
    if (agent.learning_config?.enable_feedback_learning !== false) {
      await applyFeedbackLearning(base44, agent, execution, feedback, corrections);
      
      await base44.asServiceRole.entities.AgentFeedback.update(feedback.id, {
        applied_to_learning: true
      });
    }

    // Update agent metrics
    const allFeedback = await base44.asServiceRole.entities.AgentFeedback.filter({ agent_id });
    const avgRating = allFeedback
      .filter(f => f.rating)
      .reduce((sum, f, idx, arr) => sum + f.rating / arr.length, 0);

    const feedbackCount = allFeedback.length;

    await base44.asServiceRole.entities.Agent.update(agent_id, {
      performance_metrics: {
        ...agent.performance_metrics,
        user_satisfaction_avg: avgRating || agent.performance_metrics?.user_satisfaction_avg || 0,
        feedback_count: feedbackCount
      }
    });

    return Response.json({
      feedback_id: feedback.id,
      applied_to_learning: true,
      message: 'Feedback processed and applied to agent learning'
    });

  } catch (error) {
    console.error('Agent feedback processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function applyFeedbackLearning(base44, agent, execution, feedback, corrections) {
  // Generate learning insights from feedback
  const learningPrompt = `Analyze this agent execution feedback and extract actionable learning:

Original Task: ${execution.task}
Execution Status: ${execution.status}
User Feedback: ${feedback.was_helpful ? 'Helpful' : 'Not helpful'}
Rating: ${feedback.rating || 'N/A'}/5
Comment: ${feedback.comment || 'None'}

${corrections.length > 0 ? `
User Corrections:
${corrections.map(c => `
- Step ${c.step_number}: ${c.original_action}
  → Should be: ${c.corrected_action}
  Reason: ${c.reason}
`).join('\n')}
` : ''}

Extract:
1. What went wrong or could improve
2. Specific action patterns to avoid
3. Specific action patterns to prefer
4. Context where these patterns apply

Return insights that can be used to improve future executions.`;

  try {
    const insights = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: learningPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          key_learnings: { type: 'array', items: { type: 'string' } },
          avoid_patterns: { type: 'array', items: { type: 'string' } },
          prefer_patterns: { type: 'array', items: { type: 'string' } },
          applicable_contexts: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    console.log('[LEARNING] Applied feedback insights:', insights);
    
    // Store learning insights in audit log for future reference
    await base44.asServiceRole.entities.AuditLog.create({
      org_id: agent.org_id,
      actor_email: 'system',
      action: 'agent_learning_applied',
      action_category: 'system',
      resource_type: 'Agent',
      resource_id: agent.id,
      status: 'success',
      details: {
        execution_id: execution.id,
        feedback_id: feedback.id,
        insights
      }
    });

  } catch (error) {
    console.error('[LEARNING] Failed to extract insights:', error);
  }
}