import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  X, ArrowLeft, Filter, Download, Calendar,
  TrendingUp, Activity, CheckCircle, XCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from 'date-fns';

export default function DrillDownDialog({ 
  open, 
  onOpenChange, 
  analyticsType, 
  dataPoint, 
  orgId, 
  timeRange 
}) {
  const [activeTab, setActiveTab] = useState('details');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch detailed data for the selected data point
  const { data: detailData = [], isLoading } = useQuery({
    queryKey: ['drill-down', analyticsType, dataPoint?.name, filterStatus, orgId],
    queryFn: async () => {
      if (!dataPoint) return [];
      
      // Fetch underlying data based on analytics type
      switch (analyticsType) {
        case 'query_volume':
          return await base44.entities.Query.filter({
            org_id: orgId,
            created_date: { $gte: dataPoint.timestamp }
          });
          
        case 'agent_performance':
          return await base44.entities.AgentExecution.filter({
            org_id: orgId,
            status: filterStatus === 'all' ? undefined : filterStatus,
            created_date: { $gte: dataPoint.timestamp }
          });
          
        case 'user_activity':
          return await base44.entities.Query.filter({
            org_id: orgId,
            user_email: dataPoint.user_email,
            created_date: { $gte: dataPoint.timestamp }
          });
          
        default:
          return [];
      }
    },
    enabled: open && !!dataPoint && !!orgId
  });

  // Calculate statistics
  const stats = calculateStats(detailData, analyticsType);

  const handleExport = () => {
    const csv = convertToCSV(detailData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analyticsType}-${dataPoint?.name || 'data'}.csv`;
    a.click();
  };

  if (!dataPoint) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onOpenChange(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                Detailed View: {dataPoint.name}
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1">
                Showing {detailData.length} records
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px] h-8">
                  <Filter className="h-3 w-3 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 py-4">
          <StatCard
            label="Total"
            value={stats.total}
            icon={Activity}
            color="blue"
          />
          <StatCard
            label="Success Rate"
            value={`${stats.successRate}%`}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            label="Failed"
            value={stats.failed}
            icon={XCircle}
            color="red"
          />
          <StatCard
            label="Avg Time"
            value={`${stats.avgTime}ms`}
            icon={TrendingUp}
            color="purple"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">Loading details...</div>
              ) : detailData.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No data available</div>
              ) : (
                detailData.map((item, idx) => (
                  <DetailCard key={idx} item={item} type={analyticsType} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="flex-1 overflow-y-auto mt-4">
            <TimelineView data={detailData} />
          </TabsContent>

          <TabsContent value="distribution" className="flex-1 overflow-y-auto mt-4">
            <DistributionView data={detailData} type={analyticsType} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <Icon className={`h-5 w-5 ${colorClasses[color]}`} />
        </div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </CardContent>
    </Card>
  );
}

function DetailCard({ item, type }) {
  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      processing: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={getStatusColor(item.status)}>
                {item.status}
              </Badge>
              {item.created_date && (
                <span className="text-xs text-slate-500">
                  {format(parseISO(item.created_date), 'MMM d, yyyy HH:mm')}
                </span>
              )}
            </div>
            <CardTitle className="text-sm">
              {type === 'query_volume' && item.prompt}
              {type === 'agent_performance' && item.task}
              {type === 'user_activity' && item.prompt}
            </CardTitle>
          </div>
          {item.latency_ms && (
            <Badge variant="outline" className="text-xs">
              {Math.round(item.latency_ms)}ms
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-slate-600">
          {type === 'query_volume' && item.response_type && (
            <div>Type: {item.response_type}</div>
          )}
          {type === 'agent_performance' && item.execution_time_ms && (
            <div>Execution time: {Math.round(item.execution_time_ms)}ms</div>
          )}
          {item.user_email && (
            <div className="text-xs text-slate-500 mt-1">By: {item.user_email}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineView({ data }) {
  const sortedData = [...data].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  );

  return (
    <div className="space-y-4">
      {sortedData.map((item, idx) => (
        <div key={idx} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`h-3 w-3 rounded-full ${
              item.status === 'completed' ? 'bg-green-500' : 
              item.status === 'failed' ? 'bg-red-500' : 
              'bg-blue-500'
            }`} />
            {idx < sortedData.length - 1 && (
              <div className="w-0.5 h-full bg-slate-200 mt-1" />
            )}
          </div>
          <div className="flex-1 pb-6">
            <div className="text-xs text-slate-500 mb-1">
              {format(parseISO(item.created_date), 'MMM d, yyyy HH:mm:ss')}
            </div>
            <div className="text-sm font-medium">
              {item.prompt || item.task || 'Execution'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Status: {item.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DistributionView({ data, type }) {
  const distribution = calculateDistribution(data, type);

  return (
    <div className="space-y-6">
      {Object.entries(distribution).map(([key, value]) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</span>
            <span className="text-sm text-slate-500">{value.count} items</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${value.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper functions
function calculateStats(data, type) {
  const total = data.length;
  const completed = data.filter(d => d.status === 'completed').length;
  const failed = data.filter(d => d.status === 'failed').length;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const times = data
    .map(d => d.latency_ms || d.execution_time_ms || 0)
    .filter(t => t > 0);
  const avgTime = times.length > 0 
    ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length)
    : 0;

  return { total, successRate, failed, avgTime };
}

function calculateDistribution(data, type) {
  const dist = {};
  
  if (type === 'query_volume') {
    // Distribution by response type
    data.forEach(item => {
      const key = item.response_type || 'unknown';
      dist[key] = dist[key] || { count: 0 };
      dist[key].count++;
    });
  } else if (type === 'agent_performance') {
    // Distribution by status
    data.forEach(item => {
      const key = item.status || 'unknown';
      dist[key] = dist[key] || { count: 0 };
      dist[key].count++;
    });
  }

  // Calculate percentages
  const total = data.length;
  Object.keys(dist).forEach(key => {
    dist[key].percentage = (dist[key].count / total) * 100;
  });

  return dist;
}

function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => 
    Object.values(item).map(v => 
      typeof v === 'string' && v.includes(',') ? `"${v}"` : v
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
}
