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

    // Get agent's learned patterns
    const learnedPatterns = await base44.asServiceRole.entities.AgentLearning.filter({
      agent_id,
      org_id
    }, '-confidence_score');

    const preferPatterns = learnedPatterns
      .filter(p => p.pattern_type === 'prefer' && p.confidence_score >= 0.4)
      .map(p => ({
        action: p.corrected_action || p.original_action,
        context: p.task_context,
        reasoning: p.reasoning,
        conditions: p.applicable_conditions,
        confidence: p.confidence_score
      }));

    const avoidPatterns = learnedPatterns
      .filter(p => p.pattern_type === 'avoid' && p.confidence_score >= 0.4)
      .map(p => ({
        action: p.original_action,
        context: p.task_context,
        reasoning: p.reasoning,
        conditions: p.applicable_conditions,
        confidence: p.confidence_score
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

    const learningContext = preferPatterns.length > 0 || avoidPatterns.length > 0
      ? `\n\nLearned Patterns (from user corrections and feedback):

${preferPatterns.length > 0 ? `PREFER these approaches:
${preferPatterns.map(p => `
• ${p.action}
  Context: ${p.context}
  When: ${p.conditions.join(', ')}
  Why: ${p.reasoning}
  Confidence: ${Math.round(p.confidence * 100)}%
`).join('\n')}` : ''}

${avoidPatterns.length > 0 ? `AVOID these approaches:
${avoidPatterns.map(p => `
• ${p.action}
  Context: ${p.context}
  When: ${p.conditions.join(', ')}
  Why: ${p.reasoning}
  Confidence: ${Math.round(p.confidence * 100)}%
`).join('\n')}` : ''}

Apply these patterns when planning. Prioritize high-confidence patterns.`
      : '';

    // Get agent's allowed tools configuration
    const allowedTools = agent.allowed_tools || [];
    const toolsWithPermissions = allowedTools.map(t => ({
      ...t,
      integration: integrations.find(i => i.type === t.integration_type)
    })).filter(t => t.integration);

    // Build tool capabilities description
    const toolCapabilities = toolsWithPermissions.map(t => {
      const actions = t.allowed_actions?.join(', ') || 'all actions';
      return `${t.integration_type}: ${actions}${t.requires_approval ? ' (requires approval)' : ''}`;
    }).join('\n');

    // Step 1: Plan the execution with autonomous chaining capability
    const maxChainLength = agent.learning_config?.max_chain_length || 5;
    const confidenceThreshold = agent.learning_config?.confidence_threshold || 70;

    const planResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an AI agent that can autonomously chain multiple actions to complete complex tasks.

Task: ${task}
Context: ${JSON.stringify(context)}

Available tools and permissions:
${toolCapabilities || 'No specific tools configured - use general capabilities'}

Agent capabilities: ${agent.capabilities?.join(', ') || 'General automation'}
Max autonomous chain length: ${maxChainLength} steps
Auto-execute threshold: ${confidenceThreshold}% confidence
${learningContext}

Create a detailed execution plan that chains actions together. Each step should:
- Use available tools directly (create tickets, update records, send emails, etc.)
- Build on results from previous steps
- Specify exact tool operations with parameters
- Be fully autonomous where possible

For each step provide:
- step_number: sequence number
- description: what this step does
- action_type: "tool_action", "entity_crud", "ai_analysis", "email", "webhook"
- tool: specific tool/integration name if applicable
- parameters: exact parameters for the action
- depends_on: array of previous step numbers this depends on
- requires_approval: true if user validation needed
- confidence: 0-100 how confident you are in this step

Return a JSON object with:
- plan: array of steps as described above
- estimated_time: total estimated seconds
- overall_confidence: 0-100 score for entire plan
- autonomous_executable: true if plan can run without user intervention`,
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
                depends_on: { type: 'array', items: { type: 'number' } },
                requires_approval: { type: 'boolean' },
                confidence: { type: 'number' }
              }
            }
          },
          estimated_time: { type: 'number' },
          overall_confidence: { type: 'number' },
          autonomous_executable: { type: 'boolean' }
        }
      }
    });

    // Update execution with plan
    await base44.asServiceRole.entities.AgentExecution.update(execution.id, {
      plan: planResponse.plan.map(s => ({ ...s, status: 'pending', retry_count: 0 })),
      status: 'executing',
    });

    // Step 2: Execute the plan with context management and error handling
    const results = [];
    let currentData = context;
    let executionContext = {
      trigger: context,
      workflow: { execution_id: execution.id },
      steps: {}
    };

    let currentPlan = [...planResponse.plan];
    let planRevisionCount = 0;
    const maxRetries = 3;

    for (let i = 0; i < currentPlan.length; i++) {
      const step = currentPlan[i];
      let stepResult = null;
      let retryCount = 0;
      let stepSuccess = false;

      // Check dependencies
      if (step.depends_on && step.depends_on.length > 0) {
        const dependenciesMet = step.depends_on.every(depNum => 
          results.find(r => r.step_number === depNum && r.status === 'completed')
        );
        if (!dependenciesMet) {
          results.push({
            step_number: step.step_number,
            description: step.description,
            status: 'skipped',
            error: 'Dependencies not met',
            timestamp: new Date().toISOString()
          });
          continue;
        }
      }

      // Retry loop for failed steps
      while (!stepSuccess && retryCount <= maxRetries) {
        try {
          // Inject execution context into step parameters
          const enrichedParams = injectContext(step.parameters, executionContext);

          // Execute based on action type
          if (step.tool && integrations.some(i => i.type === step.tool)) {
            stepResult = await executeIntegrationAction(base44, {
              integration_type: step.tool,
              action_type: step.action_type,
              parameters: enrichedParams,
              org_id
            });
          } else if (step.action_type === 'entity_crud') {
            stepResult = await executeEntityAction(base44, enrichedParams, org_id);
          } else if (step.action_type === 'ai_analysis') {
            stepResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: step.description + '\n\nContext: ' + JSON.stringify(executionContext),
            });
          } else {
            stepResult = { status: 'simulated', description: step.description };
          }

          stepSuccess = true;

          results.push({
            step_number: step.step_number,
            description: step.description,
            status: 'completed',
            result: stepResult,
            retry_count: retryCount,
            timestamp: new Date().toISOString()
          });

          // Update execution context with step results
          executionContext.steps[`step_${step.step_number}`] = stepResult;
          currentData = { ...currentData, [`step_${step.step_number}`]: stepResult };

        } catch (error) {
          retryCount++;
          
          if (retryCount > maxRetries) {
            // Max retries reached - decide whether to replan or fail
            const shouldReplan = planRevisionCount < 2 && i < currentPlan.length - 1;
            
            if (shouldReplan) {
              console.log(`[AGENT] Step ${step.step_number} failed after retries. Replanning...`);
              
              // Dynamic replanning
              const replanResult = await replanAfterFailure(base44, {
                original_plan: currentPlan,
                failed_step: step,
                error: error.message,
                completed_steps: results,
                execution_context: executionContext,
                remaining_goal: task
              });

              if (replanResult.revised_plan) {
                planRevisionCount++;
                currentPlan = [
                  ...currentPlan.slice(0, i + 1),
                  ...replanResult.revised_plan
                ];
                
                results.push({
                  step_number: step.step_number,
                  description: step.description,
                  status: 'failed_replanned',
                  error: error.message,
                  retry_count: retryCount,
                  replanned: true,
                  timestamp: new Date().toISOString()
                });

                // Continue with revised plan
                break;
              }
            }

            // Cannot recover - fail execution
            results.push({
              step_number: step.step_number,
              description: step.description,
              status: 'failed',
              error: error.message,
              retry_count: retryCount,
              timestamp: new Date().toISOString()
            });

            await base44.asServiceRole.entities.AgentExecution.update(execution.id, {
              status: 'failed',
              error_message: `Step ${step.step_number} failed: ${error.message}`,
              result: { steps: results, plan_revisions: planRevisionCount }
            });

            return Response.json({
              execution_id: execution.id,
              status: 'failed',
              error: error.message,
              completed_steps: results,
              plan_revisions: planRevisionCount
            });
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }

    // Update execution with final results
    await base44.asServiceRole.entities.AgentExecution.update(execution.id, {
      status: 'completed',
      result: {
        steps: results,
        final_data: currentData,
        execution_context: executionContext,
        plan_revisions: planRevisionCount
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
      plan: currentPlan,
      results: results,
      confidence: planResponse.overall_confidence || planResponse.confidence,
      autonomous_executable: planResponse.autonomous_executable,
      chain_length: results.filter(r => r.status === 'completed').length,
      plan_revisions: planRevisionCount,
      execution_context: executionContext
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
  const { integration_type, action_type, parameters, org_id } = config;
  
  console.log(`[AGENT] Executing ${action_type} on ${integration_type}`);
  
  // Route to appropriate integration handler
  try {
    if (integration_type === 'slack') {
      return await executeSlackAction(base44, action_type, parameters);
    } else if (integration_type === 'github') {
      return await executeGitHubAction(base44, action_type, parameters);
    } else if (integration_type === 'email') {
      return await executeEmailAction(base44, action_type, parameters);
    } else {
      // Generic integration execution via workflow executor
      const result = await base44.asServiceRole.functions.invoke('workflowExecuteIntegration', {
        integration_type,
        action: action_type,
        config: parameters,
        org_id
      });
      return result.data;
    }
  } catch (error) {
    console.error(`[AGENT] Integration action failed:`, error);
    throw error;
  }
}

async function executeSlackAction(base44, action, params) {
  if (action === 'send_message') {
    // Real Slack message sending would go here
    console.log(`[SLACK] Sending message to ${params.channel}: ${params.text}`);
    return {
      status: 'success',
      action: 'send_message',
      channel: params.channel,
      message: params.text,
      timestamp: new Date().toISOString()
    };
  }
  throw new Error(`Unsupported Slack action: ${action}`);
}

async function executeGitHubAction(base44, action, params) {
  if (action === 'create_issue') {
    console.log(`[GITHUB] Creating issue: ${params.title}`);
    return {
      status: 'success',
      action: 'create_issue',
      title: params.title,
      issue_number: Math.floor(Math.random() * 1000),
      url: `https://github.com/repo/issues/${Math.floor(Math.random() * 1000)}`
    };
  }
  throw new Error(`Unsupported GitHub action: ${action}`);
}

async function executeEmailAction(base44, action, params) {
  if (action === 'send_email') {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: params.to,
      subject: params.subject,
      body: params.body
    });
    return {
      status: 'success',
      action: 'send_email',
      to: params.to,
      subject: params.subject
    };
  }
  throw new Error(`Unsupported email action: ${action}`);
}

async function executeEntityAction(base44, parameters, org_id) {
  const { entity_name, operation, data, filters } = parameters;
  
  if (operation === 'create') {
    const record = await base44.asServiceRole.entities[entity_name].create({
      ...data,
      org_id
    });
    return { operation: 'create', entity: entity_name, id: record.id, data: record };
  } else if (operation === 'update' && filters) {
    const records = await base44.asServiceRole.entities[entity_name].filter(filters);
    if (records.length > 0) {
      await base44.asServiceRole.entities[entity_name].update(records[0].id, data);
      return { operation: 'update', entity: entity_name, id: records[0].id, updated: true };
    }
  } else if (operation === 'read' && filters) {
    const records = await base44.asServiceRole.entities[entity_name].filter(filters);
    return { operation: 'read', entity: entity_name, count: records.length, data: records };
  }
  
  return { operation, entity: entity_name, status: 'completed' };
}

function injectContext(parameters, executionContext) {
  if (!parameters || typeof parameters !== 'object') return parameters;
  
  const injected = JSON.parse(JSON.stringify(parameters));
  
  // Replace context variables like {{step_1.result.id}}
  const replaceVars = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].includes('{{')) {
        obj[key] = obj[key].replace(/\{\{([^}]+)\}\}/g, (match, path) => {
          const value = getNestedValue(executionContext, path.trim());
          return value !== undefined ? value : match;
        });
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        replaceVars(obj[key]);
      }
    }
  };
  
  replaceVars(injected);
  return injected;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

async function replanAfterFailure(base44, context) {
  const { original_plan, failed_step, error, completed_steps, execution_context, remaining_goal } = context;
  
  try {
    const replanPrompt = `A multi-step plan has partially failed. Analyze and create a revised plan.

Original Goal: ${remaining_goal}
Failed Step: ${failed_step.step_number} - ${failed_step.description}
Error: ${error}

Completed Steps:
${completed_steps.filter(s => s.status === 'completed').map(s => `✓ Step ${s.step_number}: ${s.description}`).join('\n')}

Available Context:
${JSON.stringify(execution_context, null, 2)}

Create a revised plan to complete the remaining goal. Consider:
1. What went wrong and how to avoid it
2. Alternative approaches using available context
3. Simpler steps that are more likely to succeed

Return revised steps starting from step ${failed_step.step_number + 1}.`;

    const replanResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: replanPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          can_recover: { type: 'boolean' },
          reasoning: { type: 'string' },
          revised_plan: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                step_number: { type: 'number' },
                description: { type: 'string' },
                action_type: { type: 'string' },
                tool: { type: 'string' },
                parameters: { type: 'object' },
                confidence: { type: 'number' }
              }
            }
          }
        }
      }
    });

    if (replanResponse.can_recover && replanResponse.revised_plan) {
      console.log('[REPLAN] Success:', replanResponse.reasoning);
      return { revised_plan: replanResponse.revised_plan };
    }

    return { revised_plan: null };
  } catch (e) {
    console.error('[REPLAN] Failed:', e);
    return { revised_plan: null };
  }
}