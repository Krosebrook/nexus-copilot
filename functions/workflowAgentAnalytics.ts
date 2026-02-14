import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { org_id, date_range = '30d', workflow_id, agent_id, integration_type } = await req.json();

    // Calculate date threshold
    const now = new Date();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
    const days = daysMap[date_range] || 30;
    const dateThreshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Fetch workflow executions
    let workflowExecutions = await base44.asServiceRole.entities.WorkflowExecution.filter({ org_id });
    workflowExecutions = workflowExecutions.filter(e => 
      new Date(e.created_date) >= dateThreshold
    );

    if (workflow_id) {
      workflowExecutions = workflowExecutions.filter(e => e.workflow_id === workflow_id);
    }

    // Fetch agent executions
    let agentExecutions = await base44.asServiceRole.entities.AgentExecution.filter({ org_id });
    agentExecutions = agentExecutions.filter(e => 
      new Date(e.created_date) >= dateThreshold
    );

    if (agent_id) {
      agentExecutions = agentExecutions.filter(e => e.agent_id === agent_id);
    }

    // Workflow metrics
    const totalWorkflowExecutions = workflowExecutions.length;
    const successfulWorkflows = workflowExecutions.filter(e => e.status === 'completed').length;
    const workflowSuccessRate = totalWorkflowExecutions > 0 
      ? (successfulWorkflows / totalWorkflowExecutions) * 100 
      : 0;

    const workflowExecutionTimes = workflowExecutions
      .filter(e => e.created_date && e.updated_date)
      .map(e => new Date(e.updated_date) - new Date(e.created_date));
    
    const avgWorkflowTime = workflowExecutionTimes.length > 0
      ? workflowExecutionTimes.reduce((a, b) => a + b, 0) / workflowExecutionTimes.length / 1000
      : 0;

    // Agent metrics
    const totalAgentExecutions = agentExecutions.length;
    const successfulAgents = agentExecutions.filter(e => e.status === 'completed').length;
    const agentSuccessRate = totalAgentExecutions > 0
      ? (successfulAgents / totalAgentExecutions) * 100
      : 0;

    const agentExecutionsWithFeedback = agentExecutions.filter(e => e.user_feedback?.rating);
    const avgAgentRating = agentExecutionsWithFeedback.length > 0
      ? agentExecutionsWithFeedback.reduce((sum, e) => sum + e.user_feedback.rating, 0) / agentExecutionsWithFeedback.length
      : 0;

    const agentExecutionTimes = agentExecutions
      .filter(e => e.execution_time_ms)
      .map(e => e.execution_time_ms);
    
    const avgAgentTime = agentExecutionTimes.length > 0
      ? agentExecutionTimes.reduce((a, b) => a + b, 0) / agentExecutionTimes.length / 1000
      : 0;

    // Time series data for trends
    const workflowTrend = generateTimeSeries(workflowExecutions, days);
    const agentTrend = generateTimeSeries(agentExecutions, days);

    // Workflow breakdown
    const workflows = await base44.asServiceRole.entities.Workflow.filter({ org_id });
    const workflowBreakdown = workflows.map(w => {
      const executions = workflowExecutions.filter(e => e.workflow_id === w.id);
      const successful = executions.filter(e => e.status === 'completed').length;
      return {
        workflow_id: w.id,
        name: w.name,
        executions: executions.length,
        success_rate: executions.length > 0 ? (successful / executions.length) * 100 : 0,
        avg_time: calculateAvgTime(executions)
      };
    }).filter(w => w.executions > 0);

    // Agent breakdown
    const agents = await base44.asServiceRole.entities.Agent.filter({ org_id });
    const agentBreakdown = agents.map(a => {
      const executions = agentExecutions.filter(e => e.agent_id === a.id);
      const successful = executions.filter(e => e.status === 'completed').length;
      const withFeedback = executions.filter(e => e.user_feedback?.rating);
      return {
        agent_id: a.id,
        name: a.name,
        executions: executions.length,
        success_rate: executions.length > 0 ? (successful / executions.length) * 100 : 0,
        avg_rating: withFeedback.length > 0 
          ? withFeedback.reduce((sum, e) => sum + e.user_feedback.rating, 0) / withFeedback.length 
          : 0,
        feedback_count: withFeedback.length
      };
    }).filter(a => a.executions > 0);

    // Integration usage
    const integrations = await base44.asServiceRole.entities.Integration.filter({ org_id });
    const integrationUsage = integrations.map(i => {
      const workflowsUsingIntegration = workflowExecutions.filter(e => 
        e.step_results?.some(s => s.integration_type === i.type)
      );
      return {
        integration_id: i.id,
        type: i.type,
        name: i.name,
        usage_count: workflowsUsingIntegration.length
      };
    }).filter(i => i.usage_count > 0);

    return Response.json({
      // Overall metrics
      total_workflow_executions: totalWorkflowExecutions,
      workflow_success_rate: workflowSuccessRate,
      total_agent_executions: totalAgentExecutions,
      agent_success_rate: agentSuccessRate,
      avg_completion_time: (avgWorkflowTime + avgAgentTime) / 2,
      avg_agent_rating: avgAgentRating,

      // Trends
      workflow_trend: workflowTrend,
      agent_trend: agentTrend,

      // Breakdowns
      workflow_breakdown: workflowBreakdown,
      agent_breakdown: agentBreakdown,
      integration_usage: integrationUsage,

      // Time comparisons
      period_comparison: {
        workflows: {
          current: totalWorkflowExecutions,
          previous: 0 // Would need historical comparison
        },
        agents: {
          current: totalAgentExecutions,
          previous: 0
        }
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateTimeSeries(executions, days) {
  const series = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayExecutions = executions.filter(e => 
      e.created_date?.split('T')[0] === dateStr
    );
    
    series.push({
      date: dateStr,
      count: dayExecutions.length,
      successful: dayExecutions.filter(e => e.status === 'completed').length
    });
  }
  
  return series;
}

function calculateAvgTime(executions) {
  const times = executions
    .filter(e => e.created_date && e.updated_date)
    .map(e => new Date(e.updated_date) - new Date(e.created_date));
  
  return times.length > 0
    ? times.reduce((a, b) => a + b, 0) / times.length / 1000
    : 0;
}