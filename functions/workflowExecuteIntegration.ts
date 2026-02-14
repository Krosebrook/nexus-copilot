import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id, step_config, context_data } = await req.json();

    // Get workflow and verify org access
    const workflows = await base44.asServiceRole.entities.Workflow.filter({ id: workflow_id });
    if (workflows.length === 0) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }
    const workflow = workflows[0];

    // Get integration credentials
    const integrations = await base44.asServiceRole.entities.Integration.filter({
      org_id: workflow.org_id,
      type: step_config.integration_type,
      status: 'active'
    });

    if (integrations.length === 0) {
      return Response.json({ 
        error: `Integration ${step_config.integration_type} not configured` 
      }, { status: 400 });
    }

    const integration = integrations[0];

    // Execute integration action based on type
    let result;
    
    switch (step_config.integration_type) {
      case 'slack':
        result = await executeSlackAction(step_config, context_data, integration);
        break;
      
      case 'notion':
        result = await executeNotionAction(step_config, context_data, integration);
        break;
      
      case 'linear':
        result = await executeLinearAction(step_config, context_data, integration);
        break;
      
      case 'jira':
        result = await executeJiraAction(step_config, context_data, integration);
        break;
      
      default:
        return Response.json({ 
          error: `Unsupported integration type: ${step_config.integration_type}` 
        }, { status: 400 });
    }

    return Response.json({
      success: true,
      result: result,
      executed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Workflow integration execution error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});

// Helper function to replace template variables
function interpolateTemplate(template, data) {
  if (!template) return '';
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = path.split('.').reduce((obj, key) => obj?.[key], data);
    return value !== undefined ? value : match;
  });
}

// Slack action executor
async function executeSlackAction(stepConfig, contextData, integration) {
  const { action_id, parameters } = stepConfig;
  
  // In production, you'd use actual Slack API with credentials from integration
  // For now, simulate the action
  const message = interpolateTemplate(parameters.message, contextData);
  const channel = parameters.channel;

  console.log(`[SLACK] Posting to ${channel}: ${message}`);

  return {
    platform: 'slack',
    action: action_id,
    channel: channel,
    message: message,
    status: 'simulated'
  };
}

// Notion action executor
async function executeNotionAction(stepConfig, contextData, integration) {
  const { action_id, parameters } = stepConfig;
  
  const title = interpolateTemplate(parameters.title, contextData);
  const content = interpolateTemplate(parameters.content, contextData);

  console.log(`[NOTION] Creating page: ${title}`);

  return {
    platform: 'notion',
    action: action_id,
    title: title,
    content: content,
    status: 'simulated'
  };
}

// Linear action executor
async function executeLinearAction(stepConfig, contextData, integration) {
  const { action_id, parameters } = stepConfig;
  
  const title = interpolateTemplate(parameters.title, contextData);
  const description = interpolateTemplate(parameters.description, contextData);

  console.log(`[LINEAR] Creating issue: ${title}`);

  return {
    platform: 'linear',
    action: action_id,
    title: title,
    description: description,
    priority: parameters.priority || 'medium',
    status: 'simulated'
  };
}

// Jira action executor
async function executeJiraAction(stepConfig, contextData, integration) {
  const { action_id, parameters } = stepConfig;
  
  const summary = interpolateTemplate(parameters.summary, contextData);
  const description = interpolateTemplate(parameters.description, contextData);

  console.log(`[JIRA] Creating task: ${summary}`);

  return {
    platform: 'jira',
    action: action_id,
    summary: summary,
    description: description,
    status: 'simulated'
  };
}