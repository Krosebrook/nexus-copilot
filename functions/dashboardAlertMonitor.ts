import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Monitor dashboard metrics and trigger alerts when thresholds are exceeded
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function can be called via cron job or on-demand
    const { org_id, alert_id } = await req.json();

    if (!org_id) {
      return Response.json({ error: 'Missing org_id' }, { status: 400 });
    }

    // Get active alerts for this organization
    const alerts = alert_id 
      ? await base44.entities.DashboardAlert.filter({ id: alert_id, org_id })
      : await base44.entities.DashboardAlert.filter({ org_id, status: 'active' });

    const triggeredAlerts = [];

    for (const alert of alerts) {
      try {
        // Check if alert is in cooldown period
        if (alert.last_triggered && alert.cooldown_minutes) {
          const cooldownEnd = new Date(alert.last_triggered);
          cooldownEnd.setMinutes(cooldownEnd.getMinutes() + alert.cooldown_minutes);
          
          if (new Date() < cooldownEnd) {
            continue; // Skip this alert, still in cooldown
          }
        }

        // Evaluate alert condition
        const currentValue = await evaluateMetric(
          base44,
          alert.metric,
          alert.entity_type,
          alert.entity_id,
          alert.condition.time_window,
          org_id
        );

        const isTriggered = evaluateCondition(
          currentValue,
          alert.condition.operator,
          alert.condition.value
        );

        if (isTriggered) {
          // Send notifications
          const notifications = [];
          
          for (const channel of alert.notification_channels) {
            try {
              const notificationResult = await sendNotification(
                base44,
                channel,
                alert,
                currentValue,
                org_id
              );
              
              notifications.push({
                timestamp: new Date().toISOString(),
                channel: channel.type,
                recipients: channel.config.recipients || [],
                success: notificationResult.success
              });
            } catch (error) {
              notifications.push({
                timestamp: new Date().toISOString(),
                channel: channel.type,
                recipients: [],
                success: false,
                error: error.message
              });
            }
          }

          // Update alert
          await base44.entities.DashboardAlert.update(alert.id, {
            status: 'triggered',
            last_triggered: new Date().toISOString(),
            trigger_count: (alert.trigger_count || 0) + 1,
            notifications_sent: [...(alert.notifications_sent || []), ...notifications]
          });

          triggeredAlerts.push({
            alert_id: alert.id,
            alert_name: alert.name,
            current_value: currentValue,
            threshold: alert.condition.value,
            notifications_sent: notifications.length
          });

          // Create audit log
          await base44.entities.AuditLog.create({
            org_id,
            user_email: 'system',
            action: 'alert_triggered',
            entity_type: 'DashboardAlert',
            entity_id: alert.id,
            description: `Alert triggered: ${alert.name}`,
            details: {
              metric: alert.metric,
              current_value: currentValue,
              threshold: alert.condition.value
            }
          });
        }
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
      }
    }

    return Response.json({
      success: true,
      alerts_checked: alerts.length,
      alerts_triggered: triggeredAlerts.length,
      triggered_alerts: triggeredAlerts
    });

  } catch (error) {
    console.error('Alert monitoring error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Helper functions

async function evaluateMetric(
  base44: any,
  metric: string,
  entityType: string,
  entityId: string | null,
  timeWindow: string,
  orgId: string
): Promise<number> {
  const windowMs = parseTimeWindow(timeWindow);
  const since = new Date(Date.now() - windowMs).toISOString();

  switch (metric) {
    case 'query_success_rate': {
      const queries = await base44.entities.Query.filter({ 
        org_id: orgId,
        created_date: { $gte: since }
      });
      const successful = queries.filter((q: any) => q.status === 'completed').length;
      return queries.length > 0 ? (successful / queries.length) * 100 : 100;
    }

    case 'agent_performance': {
      const filter: any = { org_id: orgId };
      if (entityId) filter.agent_id = entityId;
      
      const executions = await base44.entities.AgentExecution.filter(filter);
      const recentExecs = executions.filter((e: any) => 
        new Date(e.created_date) >= new Date(since)
      );
      
      if (recentExecs.length === 0) return 100;
      
      const successful = recentExecs.filter((e: any) => e.status === 'completed').length;
      return (successful / recentExecs.length) * 100;
    }

    case 'workflow_failures': {
      const executions = await base44.entities.AgentExecution.filter({
        org_id: orgId
      });
      const recentExecs = executions.filter((e: any) => 
        new Date(e.created_date) >= new Date(since)
      );
      return recentExecs.filter((e: any) => e.status === 'failed').length;
    }

    case 'avg_response_time': {
      const queries = await base44.entities.Query.filter({ 
        org_id: orgId,
        created_date: { $gte: since }
      });
      if (queries.length === 0) return 0;
      
      const avgTime = queries.reduce((sum: number, q: any) => 
        sum + (q.latency_ms || 0), 0
      ) / queries.length;
      return avgTime;
    }

    case 'user_satisfaction': {
      const filter: any = { org_id: orgId };
      if (entityId) filter.agent_id = entityId;
      
      const executions = await base44.entities.AgentExecution.filter(filter);
      const recentExecs = executions.filter((e: any) => 
        new Date(e.created_date) >= new Date(since) && e.user_feedback?.rating
      );
      
      if (recentExecs.length === 0) return 5;
      
      const avgRating = recentExecs.reduce((sum: number, e: any) => 
        sum + e.user_feedback.rating, 0
      ) / recentExecs.length;
      return avgRating;
    }

    default:
      throw new Error(`Unknown metric: ${metric}`);
  }
}

function evaluateCondition(
  currentValue: number,
  operator: string,
  thresholdValue: number
): boolean {
  switch (operator) {
    case 'greater_than':
      return currentValue > thresholdValue;
    case 'less_than':
      return currentValue < thresholdValue;
    case 'equals':
      return Math.abs(currentValue - thresholdValue) < 0.01;
    case 'greater_or_equal':
      return currentValue >= thresholdValue;
    case 'less_or_equal':
      return currentValue <= thresholdValue;
    default:
      return false;
  }
}

async function sendNotification(
  base44: any,
  channel: any,
  alert: any,
  currentValue: number,
  orgId: string
): Promise<{ success: boolean }> {
  switch (channel.type) {
    case 'email': {
      // In a real implementation, integrate with email service
      // For now, create an audit log entry
      await base44.entities.AuditLog.create({
        org_id: orgId,
        user_email: channel.config.recipients?.[0] || 'system',
        action: 'email_notification_sent',
        entity_type: 'DashboardAlert',
        entity_id: alert.id,
        description: `Alert notification: ${alert.name}`,
        details: {
          recipients: channel.config.recipients,
          subject: `Alert: ${alert.name}`,
          body: `Alert "${alert.name}" has been triggered.\n\nMetric: ${alert.metric}\nCurrent Value: ${currentValue}\nThreshold: ${alert.condition.value}\nCondition: ${alert.condition.operator}`
        }
      });
      return { success: true };
    }

    case 'in_app': {
      // Create in-app notification (could be a new entity type)
      await base44.entities.AuditLog.create({
        org_id: orgId,
        user_email: 'system',
        action: 'in_app_notification',
        entity_type: 'DashboardAlert',
        entity_id: alert.id,
        description: `In-app alert: ${alert.name}`,
        details: {
          title: alert.name,
          message: `${alert.metric} is ${currentValue} (threshold: ${alert.condition.value})`,
          severity: 'warning'
        }
      });
      return { success: true };
    }

    case 'webhook': {
      if (!channel.config.url) {
        throw new Error('Webhook URL not configured');
      }

      const response = await fetch(channel.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(channel.config.headers || {})
        },
        body: JSON.stringify({
          alert_name: alert.name,
          alert_id: alert.id,
          metric: alert.metric,
          current_value: currentValue,
          threshold: alert.condition.value,
          condition: alert.condition.operator,
          triggered_at: new Date().toISOString()
        })
      });

      return { success: response.ok };
    }

    default:
      throw new Error(`Unknown notification channel type: ${channel.type}`);
  }
}

function parseTimeWindow(timeWindow: string): number {
  const units: Record<string, number> = {
    'm': 60 * 1000,           // minutes
    'h': 60 * 60 * 1000,      // hours
    'd': 24 * 60 * 60 * 1000  // days
  };

  const match = timeWindow.match(/^(\d+)([mhd])$/);
  if (!match) {
    throw new Error(`Invalid time window format: ${timeWindow}`);
  }

  const [, amount, unit] = match;
  return parseInt(amount) * units[unit];
}
