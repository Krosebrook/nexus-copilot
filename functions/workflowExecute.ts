import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id, trigger_data, resume_from_step } = await req.json();

    if (!workflow_id) {
      return Response.json({ error: 'Missing workflow_id' }, { status: 400 });
    }

    // Get workflow
    const workflows = await base44.entities.Workflow.filter({ id: workflow_id });
    if (workflows.length === 0) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }
    const workflow = workflows[0];

    // Create execution record
    const execution = await base44.entities.WorkflowExecution.create({
      org_id: workflow.org_id,
      workflow_id: workflow.id,
      trigger_data: trigger_data || {},
      status: 'running',
      step_results: []
    });

    // Execute steps
    const stepResults = [];
    const startIndex = resume_from_step 
      ? workflow.steps.findIndex(s => s.id === resume_from_step)
      : 0;

    for (let i = startIndex; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const stepStartTime = Date.now();

      try {
        // Update execution with current step
        await base44.entities.WorkflowExecution.update(execution.id, {
          current_step: step.id
        });

        // Execute step (simplified - would need full implementation)
        const stepResult = await executeStep(step, trigger_data, base44);

        const stepDuration = Date.now() - stepStartTime;

        stepResults.push({
          step_id: step.id,
          status: 'success',
          result: stepResult,
          duration_ms: stepDuration,
          timestamp: new Date().toISOString()
        });

        // Update execution progress
        await base44.entities.WorkflowExecution.update(execution.id, {
          step_results: stepResults
        });

      } catch (error) {
        const stepDuration = Date.now() - stepStartTime;
        
        stepResults.push({
          step_id: step.id,
          status: 'failed',
          error: error.message,
          duration_ms: stepDuration,
          timestamp: new Date().toISOString()
        });

        // Check if we should retry
        if (step.error_config?.retry_enabled) {
          const retryCount = step.error_config.retry_count || 3;
          const retryDelay = step.error_config.retry_delay_seconds || 60;

          for (let retry = 0; retry < retryCount; retry++) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * 1000));
            
            try {
              const retryResult = await executeStep(step, trigger_data, base44);
              stepResults[stepResults.length - 1] = {
                step_id: step.id,
                status: 'success',
                result: retryResult,
                duration_ms: Date.now() - stepStartTime,
                timestamp: new Date().toISOString(),
                retry_count: retry + 1
              };
              break;
            } catch (retryError) {
              if (retry === retryCount - 1) {
                throw retryError;
              }
            }
          }
        }

        // Check if we should continue on error
        if (!step.error_config?.continue_on_error) {
          await base44.entities.WorkflowExecution.update(execution.id, {
            status: 'failed',
            error_message: error.message,
            step_results: stepResults
          });

          return Response.json({
            execution_id: execution.id,
            status: 'failed',
            error: error.message,
            step_results: stepResults
          });
        }
      }
    }

    // Update workflow execution count
    await base44.entities.Workflow.update(workflow.id, {
      execution_count: (workflow.execution_count || 0) + 1,
      last_executed: new Date().toISOString()
    });

    // Mark execution as completed
    await base44.entities.WorkflowExecution.update(execution.id, {
      status: 'completed',
      step_results: stepResults
    });

    return Response.json({
      execution_id: execution.id,
      status: 'completed',
      step_results: stepResults
    });

  } catch (error) {
    console.error('Workflow execution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function executeStep(step, triggerData, base44) {
  // Simplified step execution - would need full implementation
  switch (step.config?.action) {
    case 'send_notification':
      return { message: 'Notification sent' };
    
    case 'send_email':
      if (step.config?.recipient) {
        await base44.integrations.Core.SendEmail({
          to: step.config.recipient,
          subject: step.config.subject || 'Workflow Notification',
          body: step.config.body || 'Automated message from workflow'
        });
      }
      return { sent: true };
    
    case 'create_entity':
      if (step.config?.entity_name) {
        const entityData = step.config.data_mapping || {};
        const result = await base44.asServiceRole.entities[step.config.entity_name].create(entityData);
        return { created: true, id: result.id };
      }
      break;
    
    case 'webhook':
      if (step.config?.url) {
        const response = await fetch(step.config.url, {
          method: step.config.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(triggerData)
        });
        return { status: response.status, ok: response.ok };
      }
      break;
    
    case 'sub_workflow':
      const subWorkflowId = step.config?.sub_workflow_id;
      if (subWorkflowId) {
        const mappedData = step.config?.data_mapping ? JSON.parse(step.config.data_mapping) : triggerData;
        const subResponse = await fetch(Deno.env.get('BASE44_FUNCTION_URL') + '/workflowExecute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow_id: subWorkflowId, trigger_data: mappedData })
        });
        const subResult = await subResponse.json();
        return { sub_workflow_id: subWorkflowId, sub_execution_id: subResult.execution_id, status: subResult.status };
      }
      break;
    
    default:
      return { executed: true };
  }
  
  return { executed: true };
}