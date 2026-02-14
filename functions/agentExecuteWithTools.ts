import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agent_id, task, org_id, context = {} } = await req.json();

    // Get agent configuration
    const agents = await base44.asServiceRole.entities.Agent.filter({ id: agent_id, org_id });
    if (agents.length === 0) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }
    const agent = agents[0];

    // Get available integrations
    const integrations = await base44.asServiceRole.entities.Integration.filter({
      org_id,
      status: 'active'
    });

    // Get agent's past executions for learning
    const pastExecutions = await base44.asServiceRole.entities.AgentExecution.filter({
      agent_id,
      org_id
    }, '-created_date', 20);

    const successfulPatterns = pastExecutions
      .filter(e => e.status === 'completed' && e.user_feedback?.helpful)
      .map(e => ({
        task: e.task,
        plan: e.plan?.map(s => s.description).join(' → '),
        feedback: e.user_feedback?.comment
      }));

    const failurePatterns = pastExecutions
      .filter(e => e.status === 'failed' || e.user_feedback?.helpful === false)
      .map(e => ({
        task: e.task,
        error: e.error_message,
        feedback: e.user_feedback?.comment
      }));

    // Create execution record
    const execution = await base44.asServiceRole.entities.AgentExecution.create({
      org_id,
      agent_id,
      user_email: user.email,
      task,
      status: 'planning',
    });

    // Build agent prompt with tools and learning context
    const availableTools = integrations.map(i => ({
      name: i.type,
      capabilities: i.capabilities || []
    }));

    const learningContext = successfulPatterns.length > 0 || failurePatterns.length > 0
      ? `\n\nLearning from past executions:
${successfulPatterns.length > 0 ? `Successful approaches:\n${successfulPatterns.map(p => `- Task: ${p.task}\n  Steps: ${p.plan}\n  Feedback: ${p.feedback || 'None'}`).join('\n')}` : ''}
${failurePatterns.length > 0 ? `\nAvoid these mistakes:\n${failurePatterns.map(p => `- Task: ${p.task}\n  Error: ${p.error}\n  Feedback: ${p.feedback || 'None'}`).join('\n')}` : ''}`
      : '';

    // Step 1: Plan the execution
    const planResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an AI agent helping users automate tasks. Plan a multi-step execution for this task.

Task: ${task}
Context: ${JSON.stringify(context)}

Available tools: ${availableTools.map(t => t.name).join(', ')}
Agent capabilities: ${agent.capabilities?.join(', ') || 'General automation'}
${learningContext}

Create a detailed execution plan with 2-5 steps. Each step should:
- Use available tools when possible
- Be specific and actionable
- Build on previous steps

Return a JSON object with:
- plan: array of steps with {step_number, description, action_type, tool, parameters, requires_approval}
- estimated_time: total estimated seconds
- confidence: 0-100 score`,
      response_json_schema: {
        type: 'object',
        properties: {
          plan: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                step_number: { type: 'number' },
                description: { type: 'string' },
                action_type: { type: 'string' },
                tool: { type: 'string' },
                parameters: { type: 'object' },
                requires_approval: { type: 'boolean' }
              }
            }
          },
          estimated_time: { type: 'number' },
          confidence: { type: 'number' }
        }
      }
    });

    // Update execution with plan
    await base44.asServiceRole.entities.AgentExecution.update(execution.id, {
      plan: planResponse.plan.map(s => ({ ...s, status: 'pending' })),
      status: 'executing',
    });

    // Step 2: Execute the plan
    const results = [];
    let currentData = context;

    for (const step of planResponse.plan) {
      try {
        let stepResult;

        // Execute based on action type
        if (step.tool && integrations.some(i => i.type === step.tool)) {
          // Execute integration action
          stepResult = await executeIntegrationAction(base44, {
            integration_type: step.tool,
            action_type: step.action_type,
            parameters: step.parameters,
            org_id
          });
        } else if (step.action_type === 'entity_crud') {
          // Entity operations
          stepResult = await executeEntityAction(base44, step.parameters, org_id);
        } else if (step.action_type === 'ai_analysis') {
          // AI analysis
          stepResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: step.description + '\n\nData: ' + JSON.stringify(currentData),
          });
        } else {
          // Generic action
          stepResult = { status: 'simulated', description: step.description };
        }

        results.push({
          step_number: step.step_number,
          description: step.description,
          status: 'completed',
          result: stepResult,
          timestamp: new Date().toISOString()
        });

        // Update current data context
        currentData = { ...currentData, [`step_${step.step_number}`]: stepResult };

      } catch (error) {
        results.push({
          step_number: step.step_number,
          description: step.description,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });

        // Stop execution on error
        await base44.asServiceRole.entities.AgentExecution.update(execution.id, {
          status: 'failed',
          error_message: error.message,
          result: { steps: results }
        });

        return Response.json({
          execution_id: execution.id,
          status: 'failed',
          error: error.message,
          completed_steps: results
        });
      }
    }

    // Update execution with final results
    await base44.asServiceRole.entities.AgentExecution.update(execution.id, {
      status: 'completed',
      result: {
        steps: results,
        final_data: currentData
      }
    });

    // Update agent performance metrics
    const totalExecutions = (agent.performance_metrics?.total_executions || 0) + 1;
    const successRate = ((agent.performance_metrics?.total_executions || 0) * (agent.performance_metrics?.success_rate || 0) + 100) / totalExecutions;
    
    await base44.asServiceRole.entities.Agent.update(agent_id, {
      performance_metrics: {
        ...agent.performance_metrics,
        total_executions: totalExecutions,
        success_rate: successRate,
      }
    });

    return Response.json({
      execution_id: execution.id,
      status: 'completed',
      plan: planResponse.plan,
      results: results,
      confidence: planResponse.confidence
    });

  } catch (error) {
    console.error('Agent execution error:', error);
    return Response.json({ 
      error: error.message,
      status: 'failed'
    }, { status: 500 });
  }
});

async function executeIntegrationAction(base44, config) {
  const { integration_type, action_type, parameters } = config;
  
  // Simulate integration actions
  console.log(`[AGENT] Executing ${action_type} on ${integration_type}`);
  
  return {
    integration: integration_type,
    action: action_type,
    parameters,
    status: 'simulated',
    message: `Would execute ${action_type} on ${integration_type}`
  };
}

async function executeEntityAction(base44, parameters, org_id) {
  const { entity_name, operation, data } = parameters;
  
  if (operation === 'create') {
    const record = await base44.asServiceRole.entities[entity_name].create({
      ...data,
      org_id
    });
    return { operation: 'create', entity: entity_name, id: record.id };
  }
  
  return { operation, entity: entity_name, status: 'completed' };
}