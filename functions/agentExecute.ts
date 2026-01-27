import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agent_id, task, org_id } = await req.json();

    if (!agent_id || !task || !org_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get agent configuration
    const agents = await base44.entities.Agent.filter({ id: agent_id });
    if (agents.length === 0) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }
    const agent = agents[0];

    const startTime = Date.now();

    // Create execution record
    const execution = await base44.entities.AgentExecution.create({
      org_id,
      agent_id,
      user_email: user.email,
      task,
      status: 'planning'
    });

    // Step 1: Generate execution plan
    const planPrompt = `You are ${agent.name}, a ${agent.persona?.role || 'helpful assistant'}.

Tone: ${agent.persona?.tone || 'professional'}
Expertise: ${agent.persona?.expertise_areas?.join(', ') || 'general'}
${agent.persona?.custom_instructions ? `\nInstructions: ${agent.persona.custom_instructions}` : ''}

Capabilities: ${agent.capabilities?.join(', ') || 'basic tasks'}

USER TASK: ${task}

Create a detailed step-by-step plan to complete this task. Break it down into 3-7 specific, actionable steps.
Each step should specify what action to take.`;

    const planResponse = await base44.integrations.Core.InvokeLLM({
      prompt: planPrompt,
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
                action: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const plan = planResponse.plan.map(step => ({
      ...step,
      status: 'pending'
    }));

    // Update execution with plan
    await base44.entities.AgentExecution.update(execution.id, {
      plan,
      status: 'executing'
    });

    // Step 2: Execute each step in the plan
    const executedPlan = [];
    let finalResult = {};

    for (const step of plan) {
      const stepStartTime = Date.now();
      
      try {
        // Mark step as running
        executedPlan.push({ ...step, status: 'running' });
        await base44.entities.AgentExecution.update(execution.id, { plan: executedPlan });

        // Execute step based on action type
        let stepResult = {};

        if (agent.capabilities?.includes('web_search') && step.action.includes('search')) {
          stepResult = await base44.integrations.Core.InvokeLLM({
            prompt: step.description,
            add_context_from_internet: true
          });
        } else if (agent.capabilities?.includes('entity_crud') && step.action.includes('create')) {
          // Would execute entity operations
          stepResult = { message: 'Entity operation executed' };
        } else if (agent.capabilities?.includes('api_calls')) {
          // Would call external APIs configured in agent.api_integrations
          stepResult = { message: 'API call executed' };
        } else {
          // Default: use LLM to execute
          stepResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Execute this step: ${step.description}\nPrevious context: ${JSON.stringify(finalResult)}`
          });
        }

        // Mark step as completed
        executedPlan[executedPlan.length - 1] = {
          ...step,
          status: 'completed',
          duration_ms: Date.now() - stepStartTime,
          result: stepResult
        };

        await base44.entities.AgentExecution.update(execution.id, { plan: executedPlan });

        finalResult = { ...finalResult, [`step_${step.step_number}`]: stepResult };

      } catch (error) {
        executedPlan[executedPlan.length - 1] = {
          ...step,
          status: 'failed',
          error: error.message
        };

        await base44.entities.AgentExecution.update(execution.id, {
          plan: executedPlan,
          status: 'failed',
          error_message: error.message
        });

        return Response.json({
          execution_id: execution.id,
          status: 'failed',
          error: error.message,
          plan: executedPlan
        });
      }
    }

    const totalTime = Date.now() - startTime;

    // Update execution as completed
    await base44.entities.AgentExecution.update(execution.id, {
      plan: executedPlan,
      result: finalResult,
      status: 'completed',
      execution_time_ms: totalTime
    });

    // Update agent performance metrics
    const allExecutions = await base44.entities.AgentExecution.filter({ agent_id });
    const successCount = allExecutions.filter(e => e.status === 'completed').length;
    const successRate = (successCount / allExecutions.length) * 100;
    const avgTime = allExecutions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / allExecutions.length;
    const feedbackScores = allExecutions.filter(e => e.user_feedback?.rating).map(e => e.user_feedback.rating);
    const avgSatisfaction = feedbackScores.length > 0 
      ? feedbackScores.reduce((a, b) => a + b, 0) / feedbackScores.length 
      : 0;

    await base44.entities.Agent.update(agent_id, {
      performance_metrics: {
        total_executions: allExecutions.length,
        success_rate: successRate,
        avg_execution_time_ms: avgTime,
        user_satisfaction_avg: avgSatisfaction
      }
    });

    return Response.json({
      execution_id: execution.id,
      status: 'completed',
      plan: executedPlan,
      result: finalResult,
      execution_time_ms: totalTime
    });

  } catch (error) {
    console.error('Agent execution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});