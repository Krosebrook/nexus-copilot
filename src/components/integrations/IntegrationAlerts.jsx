import React from 'react';
import { AlertTriangle, Bell, BellOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function IntegrationAlerts({ integrations, onNotify, isNotifying }) {
  const criticalIntegrations = integrations.filter(i => 
    i.health.issues.some(issue => issue.severity === 'critical')
  );
  const warningIntegrations = integrations.filter(i => 
    i.health.issues.every(issue => issue.severity === 'warning')
  );

  return (
    <Card className="mb-8 border-2 border-amber-300 bg-amber-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Integration Alerts
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
              {integrations.length} {integrations.length === 1 ? 'issue' : 'issues'}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {criticalIntegrations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                Critical Issues ({criticalIntegrations.length})
              </h4>
              <div className="space-y-2">
                {criticalIntegrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-start justify-between p-3 bg-white rounded-lg border border-red-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{integration.name}</p>
                      <ul className="mt-1 space-y-1">
                        {integration.health.issues
                          .filter(i => i.severity === 'critical')
                          .map((issue, idx) => (
                            <li key={idx} className="text-sm text-red-700">
                              • {issue.message}
                            </li>
                          ))}
                      </ul>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNotify(integration)}
                      disabled={isNotifying}
                      className="ml-4"
                    >
                      {isNotifying ? (
                        <BellOff className="h-4 w-4" />
                      ) : (
                        <>
                          <Bell className="h-4 w-4 mr-2" />
                          Notify
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {warningIntegrations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                Warnings ({warningIntegrations.length})
              </h4>
              <div className="space-y-2">
                {warningIntegrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-start justify-between p-3 bg-white rounded-lg border border-amber-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{integration.name}</p>
                      <ul className="mt-1 space-y-1">
                        {integration.health.issues.map((issue, idx) => (
                          <li key={idx} className="text-sm text-amber-700">
                            • {issue.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}