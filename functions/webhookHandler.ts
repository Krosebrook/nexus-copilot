import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse incoming webhook
    const body = await req.json();
    const source = req.headers.get('x-webhook-source') || 'unknown';
    const workflowId = new URL(req.url).searchParams.get('workflow_id');
    const webhookSecret = new URL(req.url).searchParams.get('secret');

    if (!workflowId || !webhookSecret) {
      return Response.json({ error: 'Missing workflow_id or secret' }, { status: 400 });
    }

    // Fetch workflow and validate secret
    const workflow = await base44.asServiceRole.entities.Workflow.filter({ id: workflowId });
    if (workflow.length === 0) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const wf = workflow[0];
    if (wf.trigger_config?.webhook_secret !== webhookSecret) {
      return Response.json({ error: 'Invalid webhook secret' }, { status: 403 });
    }

    // Create workflow execution
    const execution = await base44.asServiceRole.entities.WorkflowExecution.create({
      org_id: wf.org_id,
      workflow_id: wf.id,
      trigger_data: {
        source,
        timestamp: new Date().toISOString(),
        payload: body,
      },
      status: 'running',
      step_results: [],
    });

    // Execute workflow steps
    const stepResults = [];
    for (const step of wf.steps || []) {
      try {
        let result = null;
        
        // Execute step based on type
        switch (step.config?.action) {
          case 'send_email':
            if (step.config?.recipient) {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: step.config.recipient,
                subject: `Workflow: ${wf.name}`,
                body: `Triggered by ${source} webhook\n\nPayload: ${JSON.stringify(body, null, 2)}`,
              });
              result = { status: 'sent', recipient: step.config.recipient };
            }
            break;

          case 'create_query':
            const queryPrompt = step.config?.query_prompt || `Analyze this ${source} event: ${JSON.stringify(body)}`;
            const queryResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: queryPrompt,
            });
            
            await base44.asServiceRole.entities.Query.create({
              org_id: wf.org_id,
              prompt: queryPrompt,
              response: queryResult,
              response_type: 'analysis',
              status: 'completed',
            });
            result = { status: 'created', response: queryResult };
            break;

          case 'categorize_article':
            if (step.config?.article_id) {
              const categorizeRes = await base44.asServiceRole.functions.invoke('knowledgeAI', {
                action: 'categorize',
                article_id: step.config.article_id,
                content: step.config.content || '',
              });
              
              if (categorizeRes.data?.category) {
                await base44.asServiceRole.entities.KnowledgeBase.update(step.config.article_id, {
                  category: categorizeRes.data.category,
                  tags: categorizeRes.data.tags,
                });
              }
              result = categorizeRes.data;
            }
            break;

          case 'summarize_content':
            const summaryRes = await base44.asServiceRole.functions.invoke('knowledgeAI', {
              action: 'summarize',
              content: step.config?.content || JSON.stringify(body),
            });
            result = summaryRes.data;
            break;

          case 'create_entity':
            if (step.config?.entity_name && step.config?.entity_data) {
              const entityData = typeof step.config.entity_data === 'string' 
                ? JSON.parse(step.config.entity_data) 
                : step.config.entity_data;
              
              const created = await base44.asServiceRole.entities[step.config.entity_name].create({
                org_id: wf.org_id,
                ...entityData,
              });
              result = { status: 'created', entity_id: created.id };
            }
            break;

          case 'update_entity':
            if (step.config?.entity_name && step.config?.entity_id && step.config?.entity_data) {
              const updateData = typeof step.config.entity_data === 'string' 
                ? JSON.parse(step.config.entity_data) 
                : step.config.entity_data;
              
              await base44.asServiceRole.entities[step.config.entity_name].update(
                step.config.entity_id,
                updateData
              );
              result = { status: 'updated' };
            }
            break;

          case 'webhook':
            if (step.config?.url) {
              const webhookRes = await fetch(step.config.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });
              result = { status: webhookRes.ok ? 'success' : 'failed', code: webhookRes.status };
            }
            break;

          default:
            result = { status: 'skipped', reason: 'action_not_implemented' };
        }

        stepResults.push({
          step_id: step.id,
          status: 'completed',
          result,
        });
      } catch (stepError) {
        stepResults.push({
          step_id: step.id,
          status: 'failed',
          error: stepError.message,
        });
      }
    }

    // Update execution
    await base44.asServiceRole.entities.WorkflowExecution.update(execution.id, {
      status: 'completed',
      step_results: stepResults,
    });

    // Update workflow execution count
    await base44.asServiceRole.entities.Workflow.update(wf.id, {
      execution_count: (wf.execution_count || 0) + 1,
      last_executed: new Date().toISOString(),
    });

    return Response.json({ 
      success: true, 
      execution_id: execution.id,
      steps_executed: stepResults.length 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});