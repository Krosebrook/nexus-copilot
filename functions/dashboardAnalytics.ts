import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { org_id, user_email, time_range = '7d', analytics_type } = await req.json();

    if (!org_id) {
      return Response.json({ error: 'Missing org_id' }, { status: 400 });
    }

    const now = new Date();
    const timeRanges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    const cutoffTime = new Date(now - timeRanges[time_range]);

    // Fetch data based on analytics type
    switch (analytics_type) {
      case 'workflow_analytics': {
        const executions = await base44.entities.WorkflowExecution.filter({ org_id });
        const recentExecutions = executions.filter(e => new Date(e.created_date) > cutoffTime);
        
        const successCount = recentExecutions.filter(e => e.status === 'completed').length;
        const failCount = recentExecutions.filter(e => e.status === 'failed').length;
        const avgDuration = recentExecutions.reduce((sum, e) => {
          const duration = e.step_results?.reduce((s, r) => s + (r.duration_ms || 0), 0) || 0;
          return sum + duration;
        }, 0) / (recentExecutions.length || 1);

        // Predict success rate trend
        const prediction = await predictTrend(recentExecutions, 'workflow_success');

        return Response.json({
          total_executions: recentExecutions.length,
          success_count: successCount,
          fail_count: failCount,
          success_rate: (successCount / (recentExecutions.length || 1)) * 100,
          avg_duration_ms: avgDuration,
          prediction
        });
      }

      case 'copilot_analytics': {
        const queries = await base44.entities.Query.filter({ org_id });
        const recentQueries = queries.filter(q => new Date(q.created_date) > cutoffTime);
        const userQueries = user_email 
          ? recentQueries.filter(q => q.created_by === user_email)
          : recentQueries;

        const avgTokens = userQueries.reduce((sum, q) => sum + (q.tokens_used || 0), 0) / (userQueries.length || 1);
        const avgLatency = userQueries.reduce((sum, q) => sum + (q.latency_ms || 0), 0) / (userQueries.length || 1);
        
        const typeBreakdown = userQueries.reduce((acc, q) => {
          acc[q.response_type] = (acc[q.response_type] || 0) + 1;
          return acc;
        }, {});

        return Response.json({
          total_queries: userQueries.length,
          avg_tokens: avgTokens,
          avg_latency_ms: avgLatency,
          type_breakdown: typeBreakdown,
          saved_queries: userQueries.filter(q => q.is_saved).length
        });
      }

      case 'knowledge_analytics': {
        const articles = await base44.entities.KnowledgeBase.filter({ org_id });
        const activeArticles = articles.filter(a => a.is_active);
        
        const totalUsage = articles.reduce((sum, a) => sum + (a.usage_count || 0), 0);
        const topArticles = articles
          .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
          .slice(0, 5)
          .map(a => ({ id: a.id, title: a.title, usage_count: a.usage_count }));

        return Response.json({
          total_articles: articles.length,
          active_articles: activeArticles.length,
          total_usage: totalUsage,
          avg_usage_per_article: totalUsage / (articles.length || 1),
          top_articles: topArticles
        });
      }

      case 'agent_performance': {
        const agents = await base44.entities.Agent.filter({ org_id });
        const executions = await base44.entities.AgentExecution.filter({ org_id });
        const recentExecutions = executions.filter(e => new Date(e.created_date) > cutoffTime);

        const agentStats = agents.map(agent => {
          const agentExecs = recentExecutions.filter(e => e.agent_id === agent.id);
          const successRate = agentExecs.length > 0
            ? (agentExecs.filter(e => e.status === 'completed').length / agentExecs.length) * 100
            : 0;
          
          return {
            agent_id: agent.id,
            name: agent.name,
            executions: agentExecs.length,
            success_rate: successRate,
            avg_satisfaction: agent.performance_metrics?.user_satisfaction_avg || 0
          };
        });

        return Response.json({ agents: agentStats });
      }

      case 'user_activity': {
        if (!user_email) {
          return Response.json({ error: 'user_email required for user analytics' }, { status: 400 });
        }

        const queries = await base44.entities.Query.filter({ org_id, created_by: user_email });
        const agentExecs = await base44.entities.AgentExecution.filter({ org_id, user_email });
        const recentQueries = queries.filter(q => new Date(q.created_date) > cutoffTime);

        // Activity by day
        const activityByDay = {};
        recentQueries.forEach(q => {
          const day = new Date(q.created_date).toISOString().split('T')[0];
          activityByDay[day] = (activityByDay[day] || 0) + 1;
        });

        return Response.json({
          total_queries: queries.length,
          recent_queries: recentQueries.length,
          agent_tasks: agentExecs.length,
          activity_by_day: activityByDay,
          most_active_day: Object.entries(activityByDay).sort((a, b) => b[1] - a[1])[0]
        });
      }

      default:
        return Response.json({ error: 'Invalid analytics_type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Predictive analytics helper
async function generatePredictiveAnalytics(base44, org_id, metric_type) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let historicalData = [];
  let metricName = '';
  let trend = 'stable';
  let insights = [];

  // Fetch historical data based on metric type
  if (metric_type === 'workflow_success') {
    metricName = 'Workflow Success Rate';
    const executions = await base44.entities.WorkflowExecution.filter({ 
      org_id,
      created_date: { $gte: thirtyDaysAgo.toISOString() }
    });

    // Group by day
    const dailyData = {};
    executions.forEach(exec => {
      const date = exec.created_date.split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, successful: 0 };
      }
      dailyData[date].total++;
      if (exec.status === 'completed') dailyData[date].successful++;
    });

    historicalData = Object.entries(dailyData).map(([date, data]) => ({
      date,
      actual: (data.successful / data.total) * 100
    }));

  } else if (metric_type === 'knowledge_engagement') {
    metricName = 'Knowledge Base Engagement';
    const articles = await base44.entities.KnowledgeBase.filter({ org_id });
    
    // Simulate daily engagement (in production, track actual views/queries)
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const totalUsage = articles.reduce((sum, a) => sum + (a.usage_count || 0), 0);
      historicalData.push({
        date: date.toISOString().split('T')[0],
        actual: Math.max(0, totalUsage + Math.random() * 50 - 25)
      });
    }

  } else if (metric_type === 'agent_performance') {
    metricName = 'Agent Success Rate';
    const executions = await base44.entities.AgentExecution.filter({ 
      org_id,
      created_date: { $gte: thirtyDaysAgo.toISOString() }
    });

    const dailyData = {};
    executions.forEach(exec => {
      const date = exec.created_date.split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, successful: 0 };
      }
      dailyData[date].total++;
      if (exec.status === 'completed') dailyData[date].successful++;
    });

    historicalData = Object.entries(dailyData).map(([date, data]) => ({
      date,
      actual: data.total > 0 ? (data.successful / data.total) * 100 : 0
    }));
  }

  // Simple linear regression for prediction
  if (historicalData.length >= 7) {
    const values = historicalData.map(d => d.actual);
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    
    // Calculate trend
    const firstHalf = values.slice(0, Math.floor(n / 2));
    const secondHalf = values.slice(Math.floor(n / 2));
    const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const changePercent = ((secondMean - firstMean) / firstMean) * 100;
    
    if (changePercent > 5) {
      trend = 'improving';
      insights.push(`${metricName} has increased by ${changePercent.toFixed(1)}% over the period`);
    } else if (changePercent < -5) {
      trend = 'declining';
      insights.push(`${metricName} has decreased by ${Math.abs(changePercent).toFixed(1)}% over the period`);
      insights.push('Consider reviewing recent changes or interventions');
    } else {
      trend = 'stable';
      insights.push(`${metricName} has remained stable`);
    }

    // Simple prediction: next value = mean + (recent trend * 2)
    const recentTrend = secondMean - firstMean;
    const prediction = mean + (recentTrend * 1.5);
    
    // Add prediction to chart data
    const nextDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dataWithPrediction = [
      ...historicalData,
      {
        date: nextDate.toISOString().split('T')[0],
        predicted: Math.max(0, Math.min(100, prediction))
      }
    ];

    // Calculate confidence based on variance
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const confidence = Math.max(0.5, Math.min(0.95, 1 - (stdDev / mean)));

    if (confidence > 0.8) {
      insights.push('High confidence in prediction due to consistent patterns');
    } else if (confidence < 0.6) {
      insights.push('Lower confidence due to high variability in data');
    }

    return {
      metric_type,
      metric_name: metricName,
      historical_with_prediction: dataWithPrediction,
      next_period_prediction: prediction,
      trend,
      confidence_score: confidence,
      insights,
      generated_at: new Date().toISOString()
    };
  }

  return {
    error: 'Insufficient data for predictions',
    message: 'Need at least 7 days of data for meaningful predictions'
  };
}

async function predictTrend(executions, metric) {
  // Simple trend prediction based on recent data
  if (executions.length < 3) {
    return { trend: 'insufficient_data', confidence: 0 };
  }

  const sortedByDate = executions.sort((a, b) => 
    new Date(a.created_date) - new Date(b.created_date)
  );

  const recentHalf = sortedByDate.slice(Math.floor(sortedByDate.length / 2));
  const olderHalf = sortedByDate.slice(0, Math.floor(sortedByDate.length / 2));

  if (metric === 'workflow_success') {
    const recentSuccess = recentHalf.filter(e => e.status === 'completed').length / recentHalf.length;
    const olderSuccess = olderHalf.filter(e => e.status === 'completed').length / olderHalf.length;
    
    const trend = recentSuccess > olderSuccess ? 'improving' : 
                  recentSuccess < olderSuccess ? 'declining' : 'stable';
    
    return {
      trend,
      confidence: Math.abs(recentSuccess - olderSuccess) * 100,
      predicted_next_week: Math.min(100, Math.max(0, recentSuccess * 100 + (recentSuccess - olderSuccess) * 50))
    };
  }

  return { trend: 'stable', confidence: 50 };
}