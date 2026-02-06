import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Settings, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import AnalyticsChart from './AnalyticsChart';
import WidgetLibrary from './WidgetLibrary';
import PredictiveAnalyticsWidget from './PredictiveAnalyticsWidget';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function CustomizableDashboard({ orgId, userEmail }) {
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const queryClient = useQueryClient();

  const { data: widgets = [] } = useQuery({
    queryKey: ['dashboard-widgets', userEmail],
    queryFn: () => base44.entities.DashboardWidget.filter({
      org_id: orgId,
      user_email: userEmail
    }),
    enabled: !!orgId && !!userEmail
  });

  const createWidgetMutation = useMutation({
    mutationFn: async ({ widget_type, title }) => {
      await base44.entities.DashboardWidget.create({
        org_id: orgId,
        user_email: userEmail,
        widget_type,
        title,
        config: { time_range: '7d', chart_type: 'line' },
        position: { x: 0, y: widgets.length * 2, width: 6, height: 2 },
        is_visible: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] });
      setAddWidgetOpen(false);
    }
  });

  const updateWidgetMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      await base44.entities.DashboardWidget.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] });
    }
  });

  const deleteWidgetMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.DashboardWidget.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] });
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    items.forEach((widget, idx) => {
      updateWidgetMutation.mutate({
        id: widget.id,
        updates: { position: { ...widget.position, y: idx * 2 } }
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">My Dashboard</h2>
        <Button onClick={() => setAddWidgetOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Widget
        </Button>
      </div>

      {widgets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-200">
          <p className="text-slate-500 mb-4">No widgets yet. Add your first widget to get started.</p>
          <Button onClick={() => setAddWidgetOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard-widgets">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {widgets.filter(w => w.is_visible).map((widget, index) => (
                  <Draggable key={widget.id} draggableId={widget.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="relative group"
                      >
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setEditingWidget(widget)}
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => deleteWidgetMutation.mutate(widget.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        {widget.widget_type.startsWith('predictive_') ? (
                          <PredictiveAnalyticsWidget
                            orgId={orgId}
                            metricType={widget.widget_type.replace('predictive_', '')}
                            title={widget.title}
                          />
                        ) : (
                          <AnalyticsChart
                            orgId={orgId}
                            userEmail={widget.widget_type === 'user_activity' ? userEmail : null}
                            analyticsType={widget.widget_type}
                            timeRange={widget.config?.time_range || '7d'}
                            chartType={widget.config?.chart_type || 'line'}
                            title={widget.title}
                          />
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Add Widget Dialog */}
      <Dialog open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Dashboard Widget</DialogTitle>
          </DialogHeader>
          <WidgetLibrary
            onAddWidget={(type, title) => createWidgetMutation.mutate({ widget_type: type, title })}
            existingWidgets={widgets}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Widget Dialog */}
      {editingWidget && (
        <Dialog open={!!editingWidget} onOpenChange={(open) => !open && setEditingWidget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Widget Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Time Range</Label>
                <Select
                  value={editingWidget.config?.time_range || '7d'}
                  onValueChange={(value) => {
                    const updated = { ...editingWidget, config: { ...editingWidget.config, time_range: value } };
                    setEditingWidget(updated);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    updateWidgetMutation.mutate({
                      id: editingWidget.id,
                      updates: { config: editingWidget.config }
                    });
                    setEditingWidget(null);
                  }}
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingWidget(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}