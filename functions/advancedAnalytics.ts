import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Advanced analytics: trends, correlations, anomaly detection
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { org_id, user_email, analysis_type, time_range = '30d' } = await req.json();

    if (!org_id) {
      return Response.json({ error: 'Missing org_id' }, { status: 400 });
    }

    const now = new Date();
    const timeRanges = {
      '7d': 7, '30d': 30, '90d': 90
    };
    const days = timeRanges[time_range] || 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    let result = {};

    switch (analysis_type) {
      case 'user_trends': {
        // User-specific trend analysis
        const queries = await base44.entities.Query.filter({
          org_id,
          created_by: user_email,
          created_date: { $gte: startDate.toISOString() }
        });

        const agentExecs = await base44.entities.AgentExecution.filter({
          org_id,
          user_email,
          created_date: { $gte: startDate.toISOString() }
        });

        // Daily activity trends
        const dailyActivity = {};
        queries.forEach(q => {
          const day = q.created_date.split('T')[0];
          if (!dailyActivity[day]) {
            dailyActivity[day] = { queries: 0, avg_tokens: 0, agent_tasks: 0 };
          }
          dailyActivity[day].queries++;
          dailyActivity[day].avg_tokens += q.tokens_used || 0;
        });

        agentExecs.forEach(e => {
          const day = e.created_date.split('T')[0];
          if (!dailyActivity[day]) {
            dailyActivity[day] = { queries: 0, avg_tokens: 0, agent_tasks: 0 };
          }
          dailyActivity[day].agent_tasks++;
        });

        // Calculate trends
        const sortedDays = Object.keys(dailyActivity).sort();
        const midpoint = Math.floor(sortedDays.length / 2);
        const firstHalf = sortedDays.slice(0, midpoint);
        const secondHalf = sortedDays.slice(midpoint);

        const firstHalfAvg = firstHalf.reduce((sum, day) => sum + dailyActivity[day].queries, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, day) => sum + dailyActivity[day].queries, 0) / secondHalf.length;
        const trend = secondHalfAvg > firstHalfAvg ? 'increasing' : secondHalfAvg < firstHalfAvg ? 'decreasing' : 'stable';
        const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        result = {
          user_email,
          daily_activity: dailyActivity,
          total_queries: queries.length,
          total_agent_tasks: agentExecs.length,
          trend,
          change_percent: changePercent.toFixed(1),
          insights: [
            trend === 'increasing' ? `Activity increased by ${Math.abs(changePercent).toFixed(1)}%` :
            trend === 'decreasing' ? `Activity decreased by ${Math.abs(changePercent).toFixed(1)}%` :
            'Activity levels remain consistent'
          ]
        };
        break;
      }

      case 'correlation_analysis': {
        // Analyze correlations between metrics
        const workflows = await base44.entities.WorkflowExecution.filter({
          org_id,
          created_date: { $gte: startDate.toISOString() }
        });

        const knowledge = await base44.entities.KnowledgeBase.filter({ org_id });
        const queries = await base44.entities.Query.filter({
          org_id,
          created_date: { $gte: startDate.toISOString() }
        });

        // Group by week
        const weeklyData = {};
        workflows.forEach(w => {
          const week = getWeekKey(w.created_date);
          if (!weeklyData[week]) {
            weeklyData[week] = { workflows: 0, successful_workflows: 0, queries: 0, kb_usage: 0 };
          }
          weeklyData[week].workflows++;
          if (w.status === 'completed') weeklyData[week].successful_workflows++;
        });

        queries.forEach(q => {
          const week = getWeekKey(q.created_date);
          if (!weeklyData[week]) {
            weeklyData[week] = { workflows: 0, successful_workflows: 0, queries: 0, kb_usage: 0 };
          }
          weeklyData[week].queries++;
          weeklyData[week].kb_usage += (q.context_refs?.length || 0);
        });

        // Calculate correlations
        const weeks = Object.keys(weeklyData).sort();
        const correlations = [];

        // KB usage vs workflow success
        const kbUsage = weeks.map(w => weeklyData[w].kb_usage);
        const workflowSuccess = weeks.map(w => 
          weeklyData[w].workflows > 0 ? weeklyData[w].successful_workflows / weeklyData[w].workflows : 0
        );

        const kbWorkflowCorr = calculateCorrelation(kbUsage, workflowSuccess);
        correlations.push({
          metric_1: 'knowledge_base_usage',
          metric_2: 'workflow_success_rate',
          correlation: kbWorkflowCorr,
          strength: Math.abs(kbWorkflowCorr) > 0.7 ? 'strong' : Math.abs(kbWorkflowCorr) > 0.4 ? 'moderate' : 'weak',
          insight: kbWorkflowCorr > 0.5 ? 
            'Higher knowledge base usage correlates with better workflow success' :
            'Knowledge base usage has limited impact on workflow success'
        });

        // Query volume vs workflow activity
        const queryVol = weeks.map(w => weeklyData[w].queries);
        const workflowVol = weeks.map(w => weeklyData[w].workflows);
        const queryWorkflowCorr = calculateCorrelation(queryVol, workflowVol);
        
        correlations.push({
          metric_1: 'copilot_query_volume',
          metric_2: 'workflow_executions',
          correlation: queryWorkflowCorr,
          strength: Math.abs(queryWorkflowCorr) > 0.7 ? 'strong' : Math.abs(queryWorkflowCorr) > 0.4 ? 'moderate' : 'weak',
          insight: queryWorkflowCorr > 0.5 ?
            'Copilot usage drives workflow automation' :
            'Copilot and workflows are used independently'
        });

        result = {
          weekly_data: weeklyData,
          correlations,
          analyzed_weeks: weeks.length
        };
        break;
      }

      case 'anomaly_detection': {
        // Detect anomalies in key metrics
        const workflows = await base44.entities.WorkflowExecution.filter({
          org_id,
          created_date: { $gte: startDate.toISOString() }
        });

        const queries = await base44.entities.Query.filter({
          org_id,
          created_date: { $gte: startDate.toISOString() }
        });

        const agentExecs = await base44.entities.AgentExecution.filter({
          org_id,
          created_date: { $gte: startDate.toISOString() }
        });

        // Daily metrics
        const dailyMetrics = {};
        workflows.forEach(w => {
          const day = w.created_date.split('T')[0];
          if (!dailyMetrics[day]) {
            dailyMetrics[day] = { workflow_success_rate: 0, workflows: 0, successful: 0, queries: 0, agent_success: 0, agents: 0 };
          }
          dailyMetrics[day].workflows++;
          if (w.status === 'completed') dailyMetrics[day].successful++;
        });

        queries.forEach(q => {
          const day = q.created_date.split('T')[0];
          if (!dailyMetrics[day]) {
            dailyMetrics[day] = { workflow_success_rate: 0, workflows: 0, successful: 0, queries: 0, agent_success: 0, agents: 0 };
          }
          dailyMetrics[day].queries++;
        });

        agentExecs.forEach(e => {
          const day = e.created_date.split('T')[0];
          if (!dailyMetrics[day]) {
            dailyMetrics[day] = { workflow_success_rate: 0, workflows: 0, successful: 0, queries: 0, agent_success: 0, agents: 0 };
          }
          dailyMetrics[day].agents++;
          if (e.status === 'completed') dailyMetrics[day].agent_success++;
        });

        // Calculate success rates
        Object.keys(dailyMetrics).forEach(day => {
          const m = dailyMetrics[day];
          m.workflow_success_rate = m.workflows > 0 ? (m.successful / m.workflows) * 100 : 0;
          m.agent_success_rate = m.agents > 0 ? (m.agent_success / m.agents) * 100 : 0;
        });

        // Detect anomalies
        const anomalies = [];
        const days = Object.keys(dailyMetrics).sort();

        // Workflow success rate anomalies
        const workflowRates = days.map(d => dailyMetrics[d].workflow_success_rate);
        const workflowMean = workflowRates.reduce((a, b) => a + b, 0) / workflowRates.length;
        const workflowStdDev = Math.sqrt(
          workflowRates.reduce((sum, val) => sum + Math.pow(val - workflowMean, 2), 0) / workflowRates.length
        );

        days.forEach(day => {
          const rate = dailyMetrics[day].workflow_success_rate;
          const zScore = (rate - workflowMean) / workflowStdDev;
          if (Math.abs(zScore) > 2) {
            anomalies.push({
              date: day,
              metric: 'workflow_success_rate',
              value: rate,
              expected_range: [workflowMean - 2 * workflowStdDev, workflowMean + 2 * workflowStdDev],
              severity: Math.abs(zScore) > 3 ? 'critical' : 'warning',
              type: zScore > 0 ? 'unusually_high' : 'unusually_low',
              z_score: zScore.toFixed(2)
            });
          }
        });

        // Query volume anomalies
        const queryVols = days.map(d => dailyMetrics[d].queries);
        const queryMean = queryVols.reduce((a, b) => a + b, 0) / queryVols.length;
        const queryStdDev = Math.sqrt(
          queryVols.reduce((sum, val) => sum + Math.pow(val - queryMean, 2), 0) / queryVols.length
        );

        days.forEach(day => {
          const vol = dailyMetrics[day].queries;
          const zScore = (vol - queryMean) / queryStdDev;
          if (Math.abs(zScore) > 2) {
            anomalies.push({
              date: day,
              metric: 'query_volume',
              value: vol,
              expected_range: [queryMean - 2 * queryStdDev, queryMean + 2 * queryStdDev],
              severity: Math.abs(zScore) > 3 ? 'critical' : 'warning',
              type: zScore > 0 ? 'spike' : 'drop',
              z_score: zScore.toFixed(2)
            });
          }
        });

        result = {
          daily_metrics: dailyMetrics,
          anomalies: anomalies.sort((a, b) => b.z_score - a.z_score),
          summary: {
            total_anomalies: anomalies.length,
            critical_anomalies: anomalies.filter(a => a.severity === 'critical').length,
            warning_anomalies: anomalies.filter(a => a.severity === 'warning').length
          }
        };
        break;
      }

      default:
        return Response.json({ error: 'Invalid analysis_type' }, { status: 400 });
    }

    return Response.json({
      org_id,
      analysis_type,
      time_range,
      ...result,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Advanced analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Helper functions
function getWeekKey(dateString) {
  const date = new Date(dateString);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${week}`;
}

function calculateCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}