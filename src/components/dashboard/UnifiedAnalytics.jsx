import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import CustomizableDashboard from './CustomizableDashboard';
import AdvancedAnalyticsPanel from './AdvancedAnalyticsPanel';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

export default function UnifiedAnalytics({ orgId, userEmail }) {
  return (
    <Card className="border-0 shadow-sm">
      <Tabs defaultValue="analytics" className="w-full">
        <div className="border-b border-slate-200 px-6 pt-4">
          <TabsList className="bg-transparent h-auto p-0 border-0">
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-4 py-3"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="trends"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-4 py-3"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trends
            </TabsTrigger>
            <TabsTrigger 
              value="system"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-4 py-3"
            >
              <Activity className="h-4 w-4 mr-2" />
              System Health
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="analytics" className="p-6 m-0">
          <CustomizableDashboard orgId={orgId} userEmail={userEmail} />
        </TabsContent>

        <TabsContent value="trends" className="p-6 m-0">
          <AdvancedAnalyticsPanel orgId={orgId} userEmail={userEmail} />
        </TabsContent>

        <TabsContent value="system" className="p-6 m-0">
          <div className="text-center py-12 text-slate-500">
            System health metrics coming soon
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}