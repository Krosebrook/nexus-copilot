import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import AIGlyph from '@/components/shared/AIGlyph';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';

export default function AlertHero({ orgId }) {
  const { data: analytics } = useQuery({
    queryKey: ['alert-hero', orgId],
    queryFn: async () => {
      const res = await base44.functions.invoke('advancedAnalytics', {
        org_id: orgId,
        analysis_type: 'anomaly_detection',
        time_range: '30d'
      });
      return res.data?.anomalies || [];
    },
    enabled: !!orgId,
    refetchInterval: 300000
  });

  const criticalAlerts = analytics?.filter(a => a.severity === 'critical') || [];

  if (criticalAlerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-0 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-700">All Systems Optimal</h3>
              <p className="text-sm text-slate-600">No critical issues detected across your workspace</p>
            </div>
          </div>
          <Link to={createPageUrl('Copilot')}>
            <Button size="lg" className="bg-slate-900 hover:bg-slate-800 gap-2 shadow-sm">
              <AIGlyph size="sm" className="text-white" />
              Ask Copilot
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  const topAlert = criticalAlerts[0];
  const getAlertAction = (metric) => {
    if (metric === 'workflow_success_rate') return { text: 'Review Workflows', link: 'WorkflowBuilder' };
    if (metric === 'query_volume') return { text: 'Check Copilot', link: 'Copilot' };
    return { text: 'View Details', link: 'Dashboard' };
  };

  const action = getAlertAction(topAlert.metric);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={topAlert.metric}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border-0 shadow-xl"
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-6 flex-1">
            <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-slate-700">Critical Alert</h3>
                <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-medium rounded">
                  URGENT
                </span>
              </div>
              <p className="text-sm text-slate-700 mb-3">
                {topAlert.metric.replace(/_/g, ' ')} {topAlert.type} detected on {topAlert.date}
              </p>
              {criticalAlerts.length > 1 && (
                <p className="text-xs text-slate-500">
                  +{criticalAlerts.length - 1} more critical {criticalAlerts.length === 2 ? 'issue' : 'issues'}
                </p>
              )}
            </div>
          </div>
          <Link to={createPageUrl(action.link)}>
            <Button size="lg" variant="destructive" className="gap-2 flex-shrink-0 shadow-sm">
              {action.text}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}