import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function IntegrationReview({ setupData }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Review your setup</h2>
      <p className="text-slate-500 mb-6">Confirm the details before completing the integration</p>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-slate-900 mb-2">Integration Details</h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Type:</span>
              <span className="text-sm font-medium capitalize">{setupData.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Name:</span>
              <span className="text-sm font-medium">{setupData.name}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-900 mb-2">Enabled Capabilities</h3>
          <div className="flex flex-wrap gap-2">
            {setupData.capabilities.map((cap) => (
              <Badge key={cap} variant="secondary">
                <CheckCircle className="h-3 w-3 mr-1" />
                {cap.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>

        {setupData.config?.webhook_url && (
          <div>
            <h3 className="text-sm font-medium text-slate-900 mb-2">Webhook Configuration</h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 break-all">{setupData.config.webhook_url}</p>
            </div>
          </div>
        )}

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-900">
            ✓ Everything looks good! Click "Complete Setup" to finish connecting this integration.
          </p>
        </div>
      </div>
    </div>
  );
}