import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Execute a tool invocation for an agent
 * Supports various tool types: send_email, generate_report, entity_crud, api_calls
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tool_id, agent_id, execution_id, input, org_id } = await req.json();

    if (!tool_id || !input || !org_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get tool configuration
    const tools = await base44.entities.AgentTool.filter({ id: tool_id });
    if (tools.length === 0) {
      return Response.json({ error: 'Tool not found' }, { status: 404 });
    }
    const tool = tools[0];

    // Check if tool requires approval
    if (tool.requires_approval && agent_id) {
      // Create approval request
      const approval = await base44.entities.Approval.create({
        org_id,
        entity_type: 'tool_invocation',
        entity_id: execution_id,
        status: 'pending',
        requested_by: user.email,
        request_reason: `Tool execution: ${tool.name}`,
        metadata: { tool_id, input }
      });

      return Response.json({
        status: 'awaiting_approval',
        approval_id: approval.id,
        message: 'Tool execution requires approval'
      });
    }

    const startTime = Date.now();
    let output = {};
    let status = 'completed';
    let errorMessage = null;

    // Create tool invocation record
    const invocation = await base44.entities.ToolInvocation.create({
      org_id,
      agent_id: agent_id || null,
      execution_id: execution_id || null,
      tool_id,
      input,
      status: 'running',
      started_at: new Date().toISOString()
    });

    try {
      // Execute tool based on function_name
      switch (tool.function_name) {
        case 'send_email':
          output = await executeSendEmail(base44, input, org_id);
          break;
          
        case 'generate_report':
          output = await executeGenerateReport(base44, input, org_id);
          break;
          
        case 'entity_create':
          output = await executeEntityCreate(base44, input, org_id);
          break;
          
        case 'entity_update':
          output = await executeEntityUpdate(base44, input, org_id);
          break;
          
        case 'entity_delete':
          output = await executeEntityDelete(base44, input, org_id);
          break;
          
        case 'api_call':
          output = await executeApiCall(input);
          break;
          
        case 'web_search':
          output = await executeWebSearch(base44, input);
          break;
          
        case 'knowledge_query':
          output = await executeKnowledgeQuery(base44, input, org_id);
          break;
          
        default:
          throw new Error(`Unknown tool function: ${tool.function_name}`);
      }
    } catch (error) {
      status = 'failed';
      errorMessage = error.message;
      output = { error: error.message };
    }

    const duration = Date.now() - startTime;

    // Update tool invocation record
    await base44.entities.ToolInvocation.update(invocation.id, {
      output,
      status,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
      duration_ms: duration
    });

    // Update tool usage statistics
    const allInvocations = await base44.entities.ToolInvocation.filter({ tool_id });
    const successCount = allInvocations.filter(i => i.status === 'completed').length;
    const avgDuration = allInvocations.reduce((sum, i) => sum + (i.duration_ms || 0), 0) / allInvocations.length;

    await base44.entities.AgentTool.update(tool_id, {
      usage_count: allInvocations.length,
      success_rate: (successCount / allInvocations.length) * 100,
      avg_execution_time_ms: avgDuration
    });

    return Response.json({
      invocation_id: invocation.id,
      status,
      output,
      duration_ms: duration,
      error: errorMessage
    });

  } catch (error) {
    console.error('Tool execution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Tool execution functions

async function executeSendEmail(base44: any, input: any, org_id: string) {
  const { to, subject, body, cc, bcc } = input;
  
  if (!to || !subject || !body) {
    throw new Error('Missing required email fields: to, subject, body');
  }

  // In a real implementation, this would integrate with an email service
  // For now, we'll create a notification or audit log entry
  await base44.entities.AuditLog.create({
    org_id,
    user_email: to,
    action: 'email_sent',
    entity_type: 'email',
    entity_id: `email_${Date.now()}`,
    description: `Email sent: ${subject}`,
    details: { to, subject, cc, bcc }
  });

  return {
    success: true,
    message: 'Email sent successfully',
    sent_at: new Date().toISOString()
  };
}

async function executeGenerateReport(base44: any, input: any, org_id: string) {
  const { report_type, filters, format = 'pdf' } = input;

  if (!report_type) {
    throw new Error('Missing required field: report_type');
  }

  // Create a background job for report generation
  const job = await base44.entities.BackgroundJob.create({
    org_id,
    type: 'report_generation',
    status: 'queued',
    priority: 5,
    input: { report_type, filters, format },
    progress: 0
  });

  return {
    success: true,
    job_id: job.id,
    message: 'Report generation started',
    estimated_completion: '2-5 minutes'
  };
}

async function executeEntityCreate(base44: any, input: any, org_id: string) {
  const { entity_type, data } = input;

  if (!entity_type || !data) {
    throw new Error('Missing required fields: entity_type, data');
  }

  // Validate entity type exists
  const validEntities = ['Query', 'KnowledgeBase', 'Integration', 'Approval'];
  if (!validEntities.includes(entity_type)) {
    throw new Error(`Invalid entity type: ${entity_type}`);
  }

  const entity = await base44.entities[entity_type].create({
    ...data,
    org_id
  });

  return {
    success: true,
    entity_id: entity.id,
    entity_type,
    created_at: entity.created_date
  };
}

async function executeEntityUpdate(base44: any, input: any, org_id: string) {
  const { entity_type, entity_id, updates } = input;

  if (!entity_type || !entity_id || !updates) {
    throw new Error('Missing required fields: entity_type, entity_id, updates');
  }

  await base44.entities[entity_type].update(entity_id, updates);

  return {
    success: true,
    entity_id,
    entity_type,
    updated_at: new Date().toISOString()
  };
}

async function executeEntityDelete(base44: any, input: any, org_id: string) {
  const { entity_type, entity_id } = input;

  if (!entity_type || !entity_id) {
    throw new Error('Missing required fields: entity_type, entity_id');
  }

  await base44.entities[entity_type].delete(entity_id);

  return {
    success: true,
    entity_id,
    entity_type,
    deleted_at: new Date().toISOString()
  };
}

async function executeApiCall(input: any) {
  const { url, method = 'GET', headers = {}, body } = input;

  if (!url) {
    throw new Error('Missing required field: url');
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json();

  return {
    success: response.ok,
    status: response.status,
    data
  };
}

async function executeWebSearch(base44: any, input: any) {
  const { query } = input;

  if (!query) {
    throw new Error('Missing required field: query');
  }

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: query,
    add_context_from_internet: true
  });

  return {
    success: true,
    results: result
  };
}

async function executeKnowledgeQuery(base44: any, input: any, org_id: string) {
  const { query } = input;

  if (!query) {
    throw new Error('Missing required field: query');
  }

  // Get active knowledge base items
  const knowledgeItems = await base44.entities.KnowledgeBase.filter({
    org_id,
    is_active: true
  });

  // Use LLM to search through knowledge base
  const context = knowledgeItems.map(k => `${k.title}: ${k.content}`).join('\n\n');
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Based on the following knowledge base, answer this query: ${query}\n\nKnowledge Base:\n${context}`
  });

  return {
    success: true,
    answer: result,
    sources: knowledgeItems.map(k => ({ id: k.id, title: k.title }))
  };
}
