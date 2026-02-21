import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { org_id } = await req.json();

    if (!org_id) {
      return Response.json({ error: 'org_id is required' }, { status: 400 });
    }

    // Get all active monitors for this org
    const monitors = await base44.asServiceRole.entities.AgentMonitor.filter({
      org_id,
      is_active: true
    });

    const results = [];

    for (const monitor of monitors) {
      // Check cooldown
      if (monitor.last_triggered_at) {
        const lastTrigger = new Date(monitor.last_triggered_at);
        const cooldownMs = (monitor.cooldown_minutes || 60) * 60 * 1000;
        if (Date.now() - lastTrigger.getTime() < cooldownMs) {
          continue; // Skip, still in cooldown
        }
      }

      let shouldTrigger = false;
      let context = {};

      // Check trigger conditions
      switch (monitor.trigger_type) {
        case 'data_anomaly':
          shouldTrigger = await checkDataAnomaly(base44, monitor, org_id);
          context.trigger_reason = 'Data anomaly detected';
          break;

        case 'entity_pattern':
          shouldTrigger = await checkEntityPattern(base44, monitor, org_id);
          context.trigger_reason = 'Entity pattern matched';
          break;

        case 'metric_threshold':
          shouldTrigger = await checkMetricThreshold(base44, monitor, org_id);
          context.trigger_reason = 'Metric threshold exceeded';
          break;

        case 'schedule':
          shouldTrigger = true; // Triggered by automation schedule
          context.trigger_reason = 'Scheduled check';
          break;

        case 'calendar_event':
          shouldTrigger = await checkCalendarEvent(base44, monitor);
          context.trigger_reason = 'Calendar event detected';
          break;

        case 'message_received':
          shouldTrigger = await checkMessageReceived(base44, monitor);
          context.trigger_reason = 'Message received';
          break;
      }

      if (shouldTrigger) {
        // Get the agent
        const agents = await base44.asServiceRole.entities.Agent.filter({ id: monitor.agent_id });
        if (agents.length === 0) continue;

        const agent = agents[0];

        // Create task from template
        const task = monitor.agent_task_template
          .replace('{trigger_type}', monitor.trigger_type)
          .replace('{timestamp}', new Date().toISOString())
          .replace('{context}', JSON.stringify(context));

        // Execute agent with proactive task
        const executionResult = await base44.asServiceRole.functions.invoke('agentExecuteWithTools', {
          org_id,
          agent_id: agent.id,
          task,
          user_email: 'system@proactive',
          context: {
            proactive: true,
            monitor_id: monitor.id,
            monitor_name: monitor.name,
            ...context
          }
        });

        // Update monitor
        await base44.asServiceRole.entities.AgentMonitor.update(monitor.id, {
          last_triggered_at: new Date().toISOString(),
          trigger_count: (monitor.trigger_count || 0) + 1
        });

        // Send notification if configured
        if (monitor.notification_config?.notify_on_trigger) {
          await sendNotification(base44, monitor, agent, executionResult.data);
        }

        results.push({
          monitor_id: monitor.id,
          monitor_name: monitor.name,
          agent_name: agent.name,
          triggered: true,
          execution_id: executionResult.data?.execution_id,
          context
        });
      }
    }

    return Response.json({
      success: true,
      monitors_checked: monitors.length,
      triggers_activated: results.length,
      results
    });

  } catch (error) {
    console.error('Proactive monitor error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});

async function checkDataAnomaly(base44, monitor, org_id) {
  const { entity_name, field_name, time_window } = monitor.trigger_config;
  
  if (!entity_name || !field_name) return false;

  try {
    const timeWindowHours = parseTimeWindow(time_window || '24h');
    const cutoff = new Date(Date.now() - timeWindowHours * 3600000).toISOString();

    const records = await base44.asServiceRole.entities[entity_name].filter({ 
      org_id,
      created_date: { $gte: cutoff }
    });

    if (records.length < 10) return false; // Need minimum data points

    const values = records.map(r => r[field_name]).filter(v => typeof v === 'number');
    if (values.length === 0) return false;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const latest = values[values.length - 1];
    const deviation = Math.abs(latest - mean) / stdDev;

    return deviation > 2; // Trigger if > 2 standard deviations
  } catch (e) {
    console.error('Data anomaly check failed:', e);
    return false;
  }
}

async function checkEntityPattern(base44, monitor, org_id) {
  const { entity_name, condition } = monitor.trigger_config;
  
  if (!entity_name) return false;

  try {
    const records = await base44.asServiceRole.entities[entity_name].filter({ org_id });
    
    // Simple condition evaluation (extend as needed)
    if (condition?.includes('count >')) {
      const threshold = parseInt(condition.split('>')[1]);
      return records.length > threshold;
    }

    return false;
  } catch (e) {
    return false;
  }
}

async function checkMetricThreshold(base44, monitor, org_id) {
  const { entity_name, field_name, threshold, condition } = monitor.trigger_config;
  
  if (!entity_name || !field_name || threshold === undefined) return false;

  try {
    const records = await base44.asServiceRole.entities[entity_name].filter({ org_id }, '-created_date', 1);
    
    if (records.length === 0) return false;

    const value = records[0][field_name];
    
    if (condition === 'greater_than') {
      return value > threshold;
    } else if (condition === 'less_than') {
      return value < threshold;
    }

    return false;
  } catch (e) {
    return false;
  }
}

async function checkCalendarEvent(base44, monitor) {
  // Placeholder - implement calendar integration
  // Would check for upcoming events matching filters
  return false;
}

async function checkMessageReceived(base44, monitor) {
  // Placeholder - implement message monitoring
  // Would check integration sources for new messages
  return false;
}

async function sendNotification(base44, monitor, agent, executionData) {
  const channels = monitor.notification_config?.notification_channels || ['email'];
  
  for (const channel of channels) {
    if (channel === 'email') {
      // Get org owner for notification
      const orgs = await base44.asServiceRole.entities.Organization.filter({ id: monitor.org_id });
      if (orgs.length > 0) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: orgs[0].owner_email,
          subject: `Agent "${agent.name}" Triggered Proactively`,
          body: `Your proactive monitor "${monitor.name}" has triggered the agent.
          
Trigger Type: ${monitor.trigger_type}
Agent: ${agent.name}
Time: ${new Date().toISOString()}

The agent has started executing autonomously based on the detected condition.`
        });
      }
    }
  }
}

function parseTimeWindow(timeWindow) {
  const match = timeWindow.match(/^(\d+)([hd])$/);
  if (!match) return 24;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  return unit === 'h' ? value : value * 24;
}