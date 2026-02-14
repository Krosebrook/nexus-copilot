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
  // Extract task context
  const taskContext = extractTaskContext(execution.task);

  // Process each correction into structured patterns
  if (corrections && corrections.length > 0) {
    for (const correction of corrections) {
      // Analyze the correction to extract patterns
      const patternAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Analyze this user correction and extract structured learning patterns:

Task Type: ${taskContext}
Original Action: ${correction.original_action}
Corrected Action: ${correction.corrected_action}
User Reasoning: ${correction.reason}

Extract:
1. What pattern should be AVOIDED (the original approach)
2. What pattern should be PREFERRED (the corrected approach)
3. Specific conditions when this applies
4. Generalized rule that can apply to similar tasks

Be specific and actionable.`,
        response_json_schema: {
          type: 'object',
          properties: {
            avoid_pattern: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                why_avoid: { type: 'string' },
                conditions: { type: 'array', items: { type: 'string' } }
              }
            },
            prefer_pattern: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                why_prefer: { type: 'string' },
                conditions: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      });

      // Store avoid pattern
      if (patternAnalysis.avoid_pattern) {
        await storeOrUpdatePattern(base44, {
          org_id: agent.org_id,
          agent_id: agent.id,
          pattern_type: 'avoid',
          task_context: taskContext,
          original_action: correction.original_action,
          corrected_action: null,
          reasoning: patternAnalysis.avoid_pattern.why_avoid,
          applicable_conditions: patternAnalysis.avoid_pattern.conditions || [],
          feedback_id: feedback.id
        });
      }

      // Store prefer pattern
      if (patternAnalysis.prefer_pattern) {
        await storeOrUpdatePattern(base44, {
          org_id: agent.org_id,
          agent_id: agent.id,
          pattern_type: 'prefer',
          task_context: taskContext,
          original_action: correction.original_action,
          corrected_action: correction.corrected_action,
          reasoning: patternAnalysis.prefer_pattern.why_prefer,
          applicable_conditions: patternAnalysis.prefer_pattern.conditions || [],
          feedback_id: feedback.id
        });
      }
    }
  }

  // Process overall feedback sentiment
  if (feedback.was_helpful === false && feedback.comment) {
    const generalLearning = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Extract general learning from negative feedback:

Task: ${execution.task}
Feedback: ${feedback.comment}
Plan: ${execution.plan?.map(s => s.description).join(' → ')}

What should the agent avoid doing in similar situations?`,
      response_json_schema: {
        type: 'object',
        properties: {
          avoid_patterns: { type: 'array', items: { type: 'string' } },
          context: { type: 'string' }
        }
      }
    });

    for (const pattern of generalLearning.avoid_patterns || []) {
      await storeOrUpdatePattern(base44, {
        org_id: agent.org_id,
        agent_id: agent.id,
        pattern_type: 'avoid',
        task_context: taskContext,
        original_action: pattern,
        corrected_action: null,
        reasoning: feedback.comment,
        applicable_conditions: [generalLearning.context],
        feedback_id: feedback.id
      });
    }
  }

  console.log('[LEARNING] Structured patterns stored for agent improvement');
}

function extractTaskContext(task) {
  const lower = task.toLowerCase();
  if (lower.includes('ticket') || lower.includes('issue')) return 'ticket_management';
  if (lower.includes('email') || lower.includes('message')) return 'communication';
  if (lower.includes('data') || lower.includes('record')) return 'data_management';
  if (lower.includes('report') || lower.includes('analysis')) return 'reporting';
  if (lower.includes('notification') || lower.includes('alert')) return 'notifications';
  return 'general_automation';
}

async function storeOrUpdatePattern(base44, patternData) {
  // Check if similar pattern exists
  const existing = await base44.asServiceRole.entities.AgentLearning.filter({
    agent_id: patternData.agent_id,
    pattern_type: patternData.pattern_type,
    task_context: patternData.task_context
  });

  // Find exact or similar match
  const similar = existing.find(p => {
    const similarity = calculateSimilarity(
      p.original_action || '',
      patternData.original_action || ''
    );
    return similarity > 0.7; // 70% similarity threshold
  });

  if (similar) {
    // Update existing pattern - increase confidence
    const newConfidence = Math.min(similar.confidence_score + 0.2, 1.0);
    const newCount = similar.feedback_count + 1;
    
    await base44.asServiceRole.entities.AgentLearning.update(similar.id, {
      confidence_score: newConfidence,
      feedback_count: newCount,
      source_feedback_ids: [...(similar.source_feedback_ids || []), patternData.feedback_id],
      last_validated: new Date().toISOString(),
      reasoning: patternData.reasoning // Update with latest reasoning
    });
    
    console.log(`[LEARNING] Pattern reinforced (confidence: ${newConfidence})`);
  } else {
    // Create new pattern
    await base44.asServiceRole.entities.AgentLearning.create({
      ...patternData,
      confidence_score: 0.5, // Start with moderate confidence
      feedback_count: 1,
      source_feedback_ids: [patternData.feedback_id],
      last_validated: new Date().toISOString()
    });
    
    console.log(`[LEARNING] New pattern created`);
  }
}

function calculateSimilarity(str1, str2) {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  const intersection = words1.filter(w => words2.includes(w));
  return intersection.length / Math.max(words1.length, words2.length);
}