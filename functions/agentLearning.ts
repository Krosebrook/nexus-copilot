import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Analyze agent executions and generate learning insights
 * Provides persona refinement suggestions and pattern identification
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agent_id, org_id, analysis_type = 'full' } = await req.json();

    if (!agent_id || !org_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get agent
    const agents = await base44.entities.Agent.filter({ id: agent_id });
    if (agents.length === 0) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }
    const agent = agents[0];

    // Get all executions for this agent
    const executions = await base44.entities.AgentExecution.filter({ 
      agent_id,
      org_id 
    });

    // Separate successful and failed executions
    const successful = executions.filter(e => e.status === 'completed' && e.user_feedback?.rating >= 4);
    const failed = executions.filter(e => e.status === 'failed' || e.user_feedback?.rating <= 2);

    // Analyze patterns
    const successPatterns = analyzePatterns(successful);
    const failurePatterns = analyzePatterns(failed);

    // Generate persona refinement suggestions
    const personaSuggestions = await generatePersonaSuggestions(
      base44,
      agent,
      successPatterns,
      failurePatterns
    );

    // Generate capability recommendations
    const capabilityRecommendations = generateCapabilityRecommendations(
      successful,
      failed,
      agent.capabilities
    );

    // Generate tool recommendations
    const toolRecommendations = await generateToolRecommendations(
      base44,
      agent,
      successPatterns
    );

    // Calculate improvement metrics
    const improvementMetrics = calculateImprovementMetrics(executions);

    // Store learning data
    const learning = {
      successful_patterns: successPatterns,
      failed_patterns: failurePatterns,
      persona_suggestions: personaSuggestions,
      capability_recommendations: capabilityRecommendations,
      tool_recommendations: toolRecommendations,
      improvement_metrics: improvementMetrics,
      analyzed_at: new Date().toISOString(),
      sample_size: executions.length
    };

    // Update agent with learning data
    await base44.entities.Agent.update(agent_id, {
      learning_data: learning,
      updated_date: new Date().toISOString()
    });

    // Create audit log
    await base44.entities.AuditLog.create({
      org_id,
      user_email: user.email,
      action: 'agent_learning_analysis',
      entity_type: 'Agent',
      entity_id: agent_id,
      description: `Learning analysis completed for agent: ${agent.name}`,
      details: { 
        executions_analyzed: executions.length,
        suggestions_generated: personaSuggestions.length
      }
    });

    return Response.json({
      success: true,
      learning,
      message: `Analyzed ${executions.length} executions and generated ${personaSuggestions.length} suggestions`
    });

  } catch (error) {
    console.error('Agent learning error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Helper functions

function analyzePatterns(executions: any[]) {
  const patterns = [];

  // Group by task type
  const taskTypeGroups = groupBy(executions, e => extractTaskType(e.task));
  
  for (const [taskType, execs] of Object.entries(taskTypeGroups)) {
    if ((execs as any[]).length >= 2) {
      const avgTime = (execs as any[]).reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / (execs as any[]).length;
      const commonTools = findCommonTools(execs as any[]);
      const commonSteps = findCommonSteps(execs as any[]);

      patterns.push({
        task_type: taskType,
        frequency: (execs as any[]).length,
        avg_execution_time_ms: avgTime,
        common_tools: commonTools,
        common_steps: commonSteps,
        success_indicators: extractSuccessIndicators(execs as any[])
      });
    }
  }

  return patterns;
}

async function generatePersonaSuggestions(
  base44: any,
  agent: any,
  successPatterns: any[],
  failurePatterns: any[]
) {
  const suggestions = [];

  // Analyze tone effectiveness
  const feedbackComments = await base44.entities.AgentExecution.filter({ 
    agent_id: agent.id 
  }).then((execs: any[]) => 
    execs.filter(e => e.user_feedback?.comment).map(e => e.user_feedback.comment)
  );

  if (feedbackComments.length > 5) {
    const toneAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze these user feedback comments about an AI agent with current tone "${agent.persona?.tone || 'professional'}":
      
${feedbackComments.slice(0, 10).join('\n')}

Should the agent's tone be adjusted? Suggest ONE improvement if needed, or respond "No change needed".`,
      max_tokens: 200
    });

    if (!toneAnalysis.toLowerCase().includes('no change')) {
      suggestions.push({
        type: 'persona_tone',
        current_value: agent.persona?.tone || 'professional',
        suggested_value: toneAnalysis,
        confidence: 0.7,
        reason: 'Based on user feedback analysis'
      });
    }
  }

  // Analyze expertise areas based on successful patterns
  const successfulTaskTypes = successPatterns.map(p => p.task_type);
  const currentExpertise = agent.persona?.expertise_areas || [];
  const newExpertise = successfulTaskTypes.filter(t => !currentExpertise.includes(t));

  if (newExpertise.length > 0) {
    suggestions.push({
      type: 'expertise_areas',
      current_value: currentExpertise,
      suggested_value: [...currentExpertise, ...newExpertise.slice(0, 3)],
      confidence: 0.8,
      reason: `Agent shows strong performance in: ${newExpertise.join(', ')}`
    });
  }

  // Analyze failure patterns for instruction improvements
  if (failurePatterns.length > 0) {
    const commonFailures = failurePatterns.map(p => p.task_type).slice(0, 3);
    suggestions.push({
      type: 'custom_instructions',
      current_value: agent.persona?.custom_instructions || '',
      suggested_value: `Needs additional guidance for: ${commonFailures.join(', ')}`,
      confidence: 0.6,
      reason: 'Identified areas with higher failure rates'
    });
  }

  return suggestions;
}

function generateCapabilityRecommendations(
  successful: any[],
  failed: any[],
  currentCapabilities: string[]
) {
  const recommendations = [];

  // Analyze tool usage in successful executions
  const toolsUsed = new Set();
  successful.forEach(exec => {
    exec.plan?.forEach((step: any) => {
      step.tool_invocations?.forEach((inv: any) => {
        toolsUsed.add(inv.tool_id);
      });
    });
  });

  // Map tools to capabilities
  const capabilityMapping: Record<string, string[]> = {
    'send_email': ['communication'],
    'generate_report': ['data_analysis', 'reporting'],
    'api_call': ['api_integration'],
    'web_search': ['web_search'],
    'entity_create': ['entity_crud']
  };

  toolsUsed.forEach(toolId => {
    const caps = capabilityMapping[toolId as string] || [];
    caps.forEach(cap => {
      if (!currentCapabilities.includes(cap)) {
        recommendations.push({
          capability: cap,
          reason: `Successfully used ${toolId} in ${successful.length} executions`,
          confidence: 0.8
        });
      }
    });
  });

  return recommendations;
}

async function generateToolRecommendations(
  base44: any,
  agent: any,
  successPatterns: any[]
) {
  const recommendations = [];

  // Get all available tools
  const allTools = await base44.entities.AgentTool.filter({});
  const currentTools = agent.available_tools?.map((t: any) => t.tool_id) || [];

  // Find tools used in similar successful agents
  const similarAgents = await base44.entities.Agent.filter({
    org_id: agent.org_id
  });

  for (const tool of allTools) {
    if (!currentTools.includes(tool.id)) {
      // Check if tool aligns with success patterns
      const relevantPatterns = successPatterns.filter(p => 
        p.task_type.toLowerCase().includes(tool.category.toLowerCase())
      );

      if (relevantPatterns.length > 0) {
        recommendations.push({
          tool_id: tool.id,
          tool_name: tool.name,
          reason: `Relevant for ${relevantPatterns.length} successful task types`,
          confidence: 0.7
        });
      }
    }
  }

  return recommendations.slice(0, 5); // Top 5 recommendations
}

function calculateImprovementMetrics(executions: any[]) {
  if (executions.length < 10) {
    return {
      insufficient_data: true,
      message: 'Need at least 10 executions for meaningful metrics'
    };
  }

  // Sort by date
  const sorted = executions.sort((a, b) => 
    new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
  );

  // Split into first half and second half
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const firstHalfSuccess = firstHalf.filter(e => e.status === 'completed').length / firstHalf.length;
  const secondHalfSuccess = secondHalf.filter(e => e.status === 'completed').length / secondHalf.length;

  const firstHalfRating = calculateAverageRating(firstHalf);
  const secondHalfRating = calculateAverageRating(secondHalf);

  const firstHalfTime = calculateAverageTime(firstHalf);
  const secondHalfTime = calculateAverageTime(secondHalf);

  return {
    success_rate_improvement: ((secondHalfSuccess - firstHalfSuccess) * 100).toFixed(2) + '%',
    rating_improvement: (secondHalfRating - firstHalfRating).toFixed(2),
    speed_improvement: ((firstHalfTime - secondHalfTime) / firstHalfTime * 100).toFixed(2) + '%',
    trend: secondHalfSuccess > firstHalfSuccess ? 'improving' : 'declining'
  };
}

// Utility functions

function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((result, item) => {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

function extractTaskType(task: string): string {
  const keywords = {
    'data': ['analyze', 'data', 'report', 'statistics'],
    'communication': ['email', 'send', 'notify', 'message'],
    'automation': ['automate', 'schedule', 'trigger'],
    'search': ['search', 'find', 'lookup'],
    'create': ['create', 'generate', 'make']
  };

  const taskLower = task.toLowerCase();
  for (const [type, words] of Object.entries(keywords)) {
    if (words.some(word => taskLower.includes(word))) {
      return type;
    }
  }

  return 'general';
}

function findCommonTools(executions: any[]): string[] {
  const toolCounts: Record<string, number> = {};
  
  executions.forEach(exec => {
    exec.plan?.forEach((step: any) => {
      step.tool_invocations?.forEach((inv: any) => {
        toolCounts[inv.tool_id] = (toolCounts[inv.tool_id] || 0) + 1;
      });
    });
  });

  return Object.entries(toolCounts)
    .filter(([_, count]) => count >= executions.length * 0.5)
    .map(([tool, _]) => tool);
}

function findCommonSteps(executions: any[]): string[] {
  const stepDescriptions: Record<string, number> = {};
  
  executions.forEach(exec => {
    exec.plan?.forEach((step: any) => {
      const key = step.action || step.description;
      stepDescriptions[key] = (stepDescriptions[key] || 0) + 1;
    });
  });

  return Object.entries(stepDescriptions)
    .filter(([_, count]) => count >= executions.length * 0.5)
    .map(([step, _]) => step)
    .slice(0, 3);
}

function extractSuccessIndicators(executions: any[]): string[] {
  const indicators = [];
  
  const avgRating = calculateAverageRating(executions);
  if (avgRating >= 4) {
    indicators.push('high_user_satisfaction');
  }

  const avgTime = calculateAverageTime(executions);
  if (avgTime < 5000) {
    indicators.push('fast_execution');
  }

  const successRate = executions.filter(e => e.status === 'completed').length / executions.length;
  if (successRate >= 0.9) {
    indicators.push('high_reliability');
  }

  return indicators;
}

function calculateAverageRating(executions: any[]): number {
  const ratings = executions
    .filter(e => e.user_feedback?.rating)
    .map(e => e.user_feedback.rating);
  
  return ratings.length > 0 
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
    : 0;
}

function calculateAverageTime(executions: any[]): number {
  const times = executions
    .filter(e => e.execution_time_ms)
    .map(e => e.execution_time_ms);
  
  return times.length > 0 
    ? times.reduce((a, b) => a + b, 0) / times.length 
    : 0;
}
