import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id, org_id } = await req.json();

    if (!workflow_id) {
      return Response.json({ error: 'Missing workflow_id' }, { status: 400 });
    }

    // Get workflow
    const workflows = await base44.asServiceRole.entities.Workflow.filter({ id: workflow_id });
    if (workflows.length === 0) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }
    const workflow = workflows[0];

    // Get execution history
    const executions = await base44.asServiceRole.entities.WorkflowExecution.filter({ 
      workflow_id: workflow_id,
      org_id: org_id
    });

    // Calculate execution metrics
    const totalExecutions = executions.length;
    const failedExecutions = executions.filter(e => e.status === 'failed');
    const successRate = totalExecutions > 0 
      ? ((totalExecutions - failedExecutions.length) / totalExecutions) * 100 
      : 0;

    // Analyze step performance
    const stepMetrics = analyzeStepPerformance(executions, workflow.steps || []);
    
    // Get integrations and tools
    const integrations = await base44.asServiceRole.entities.Integration.filter({ org_id: org_id });

    // Build context for AI analysis
    const analysisContext = `
Workflow: ${workflow.name}
Description: ${workflow.description || 'No description'}
Trigger Type: ${workflow.trigger_type}
Total Executions: ${totalExecutions}
Success Rate: ${successRate.toFixed(2)}%
Failed Executions: ${failedExecutions.length}

Steps Configuration:
${JSON.stringify(workflow.steps, null, 2)}

Step Performance Metrics:
${JSON.stringify(stepMetrics, null, 2)}

Recent Failures:
${failedExecutions.slice(0, 5).map(e => `- ${e.error_message || 'Unknown error'}`).join('\n')}

Available Integrations:
${integrations.map(i => `- ${i.name} (${i.type})`).join('\n')}
`;

    // Call AI for insights
    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a workflow optimization expert. Analyze this workflow and provide actionable insights.

${analysisContext}

Provide insights in the following JSON format:
{
  "optimization_score": <number 0-100>,
  "insights": [
    {
      "type": "performance" | "reliability" | "efficiency" | "cost",
      "severity": "high" | "medium" | "low",
      "title": "Brief title",
      "description": "Detailed description",
      "impact": "What improvement this would bring",
      "recommendation": {
        "action": "specific action to take",
        "step_changes": [{"step_id": "id", "suggested_change": "what to change"}]
      }
    }
  ],
  "bottlenecks": [
    {
      "step_id": "step id",
      "issue": "description of bottleneck",
      "avg_duration_ms": <number>,
      "failure_rate": <percentage>
    }
  ],
  "redundancies": [
    {
      "step_ids": ["id1", "id2"],
      "reason": "why these steps are redundant"
    }
  ]
}

Focus on:
1. Steps that fail frequently
2. Steps with long execution times
3. Redundant or unnecessary steps
4. Better integration alternatives
5. Optimal step ordering
6. Error handling improvements`,
      response_json_schema: {
        type: "object",
        properties: {
          optimization_score: { type: "number" },
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                severity: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                impact: { type: "string" },
                recommendation: {
                  type: "object",
                  properties: {
                    action: { type: "string" },
                    step_changes: { type: "array" }
                  }
                }
              }
            }
          },
          bottlenecks: { type: "array" },
          redundancies: { type: "array" }
        }
      }
    });

    // Store insights for future reference
    await base44.asServiceRole.entities.AuditLog.create({
      org_id: org_id,
      actor_email: user.email,
      action: 'workflow_ai_analysis',
      action_category: 'system',
      resource_type: 'Workflow',
      resource_id: workflow_id,
      status: 'success',
      details: {
        optimization_score: aiResponse.optimization_score,
        insights_count: aiResponse.insights?.length || 0
      }
    });

    return Response.json({
      workflow_id: workflow_id,
      analysis_date: new Date().toISOString(),
      ...aiResponse,
      step_metrics: stepMetrics,
      execution_summary: {
        total: totalExecutions,
        failed: failedExecutions.length,
        success_rate: successRate
      }
    });

  } catch (error) {
    console.error('Workflow AI insights error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function analyzeStepPerformance(executions, steps) {
  const metrics = {};

  steps.forEach(step => {
    const stepId = step.id;
    const stepResults = executions
      .map(e => e.step_results?.find(r => r.step_id === stepId))
      .filter(Boolean);

    const failures = stepResults.filter(r => r.status === 'failed');
    const durations = stepResults
      .filter(r => r.duration_ms)
      .map(r => r.duration_ms);

    metrics[stepId] = {
      step_label: step.config?.label || stepId,
      executions: stepResults.length,
      failures: failures.length,
      failure_rate: stepResults.length > 0 ? (failures.length / stepResults.length) * 100 : 0,
      avg_duration_ms: durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0,
      max_duration_ms: durations.length > 0 ? Math.max(...durations) : 0,
      common_errors: failures.map(f => f.error).filter(Boolean)
    };
  });

  return metrics;
}