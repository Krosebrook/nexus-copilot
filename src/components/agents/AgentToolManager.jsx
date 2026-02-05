import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Wrench, Plus, Settings, X, Check, AlertCircle, 
  Mail, FileText, Database, Globe, Zap 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const TOOL_ICONS = {
  communication: Mail,
  data: Database,
  integration: Globe,
  system: Zap
};

const TOOL_CATEGORIES = {
  communication: { label: 'Communication', color: 'bg-blue-500' },
  data: { label: 'Data & Reports', color: 'bg-green-500' },
  integration: { label: 'Integrations', color: 'bg-purple-500' },
  system: { label: 'System', color: 'bg-orange-500' }
};

export default function AgentToolManager({ agentId, orgId, currentTools = [], onUpdate }) {
  const [addToolOpen, setAddToolOpen] = useState(false);
  const [createToolOpen, setCreateToolOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolConfig, setToolConfig] = useState({});
  
  const queryClient = useQueryClient();

  // Fetch available tools
  const { data: availableTools = [] } = useQuery({
    queryKey: ['agent-tools', orgId],
    queryFn: async () => {
      const publicTools = await base44.entities.AgentTool.filter({ is_public: true });
      const orgTools = await base44.entities.AgentTool.filter({ 
        allowed_orgs: { $contains: orgId } 
      });
      return [...publicTools, ...orgTools];
    },
    enabled: !!orgId
  });

  // Filter out already added tools
  const toolsToAdd = availableTools.filter(
    t => !currentTools.find(ct => ct.tool_id === t.id)
  );

  const addToolMutation = useMutation({
    mutationFn: async ({ toolId, config }) => {
      const tool = availableTools.find(t => t.id === toolId);
      const newTools = [
        ...currentTools,
        { tool_id: toolId, config: config || {} }
      ];
      
      if (onUpdate) {
        await onUpdate({ available_tools: newTools });
      }
      
      return { tool, newTools };
    },
    onSuccess: ({ tool }) => {
      toast.success(`Added tool: ${tool.name}`);
      setAddToolOpen(false);
      setSelectedTool(null);
      setToolConfig({});
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });

  const removeToolMutation = useMutation({
    mutationFn: async (toolId) => {
      const newTools = currentTools.filter(t => t.tool_id !== toolId);
      if (onUpdate) {
        await onUpdate({ available_tools: newTools });
      }
      return newTools;
    },
    onSuccess: () => {
      toast.success('Tool removed');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });

  const createToolMutation = useMutation({
    mutationFn: async (toolData) => {
      await base44.entities.AgentTool.create({
        ...toolData,
        is_public: false,
        allowed_orgs: [orgId],
        usage_count: 0,
        success_rate: 0,
        avg_execution_time_ms: 0
      });
    },
    onSuccess: () => {
      toast.success('Tool created');
      setCreateToolOpen(false);
      queryClient.invalidateQueries({ queryKey: ['agent-tools'] });
    }
  });

  const handleAddTool = () => {
    if (!selectedTool) {
      toast.error('Please select a tool');
      return;
    }
    addToolMutation.mutate({ toolId: selectedTool, config: toolConfig });
  };

  const getToolDetails = (toolId) => {
    return availableTools.find(t => t.id === toolId);
  };

  const CategoryIcon = ({ category }) => {
    const Icon = TOOL_ICONS[category] || Wrench;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Agent Tools</h3>
          <p className="text-sm text-slate-500">
            Configure tools this agent can use to perform actions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCreateToolOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Tool
          </Button>
          <Button 
            size="sm"
            onClick={() => setAddToolOpen(true)}
            disabled={toolsToAdd.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Tool
          </Button>
        </div>
      </div>

      {currentTools.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No tools configured yet</p>
            <Button size="sm" onClick={() => setAddToolOpen(true)}>
              Add Your First Tool
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentTools.map((toolRef) => {
            const tool = getToolDetails(toolRef.tool_id);
            if (!tool) return null;

            const categoryInfo = TOOL_CATEGORIES[tool.category] || TOOL_CATEGORIES.system;

            return (
              <Card key={toolRef.tool_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${categoryInfo.color} bg-opacity-10`}>
                        <CategoryIcon category={tool.category} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{tool.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {categoryInfo.label}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => removeToolMutation.mutate(toolRef.tool_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">{tool.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {tool.requires_approval && (
                      <Badge variant="outline" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Requires Approval
                      </Badge>
                    )}
                    <span>{tool.usage_count || 0} uses</span>
                    <span>{Math.round(tool.success_rate || 0)}% success</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Tool Dialog */}
      <Dialog open={addToolOpen} onOpenChange={setAddToolOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Tool to Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Tool</Label>
              <Select value={selectedTool || ''} onValueChange={setSelectedTool}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tool..." />
                </SelectTrigger>
                <SelectContent>
                  {toolsToAdd.map(tool => (
                    <SelectItem key={tool.id} value={tool.id}>
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={tool.category} />
                        <span>{tool.name}</span>
                        <span className="text-xs text-slate-500">
                          - {TOOL_CATEGORIES[tool.category]?.label}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTool && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium mb-2">Tool Details</h4>
                <p className="text-sm text-slate-600 mb-3">
                  {toolsToAdd.find(t => t.id === selectedTool)?.description}
                </p>
                <div className="space-y-2">
                  <Label className="text-xs">Tool Configuration (JSON)</Label>
                  <Textarea
                    placeholder='{"key": "value"}'
                    value={JSON.stringify(toolConfig, null, 2)}
                    onChange={(e) => {
                      try {
                        setToolConfig(JSON.parse(e.target.value));
                      } catch {}
                    }}
                    className="font-mono text-xs"
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToolOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddTool}
              disabled={!selectedTool || addToolMutation.isPending}
            >
              Add Tool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Tool Dialog */}
      <CreateToolDialog
        open={createToolOpen}
        onOpenChange={setCreateToolOpen}
        onSubmit={createToolMutation.mutate}
        isSubmitting={createToolMutation.isPending}
      />
    </div>
  );
}

function CreateToolDialog({ open, onOpenChange, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'system',
    function_name: '',
    requires_approval: false,
    max_retries: 3,
    timeout_ms: 30000
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.function_name) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Custom Tool</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tool Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Send Email"
            />
          </div>
          
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does this tool do?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="data">Data & Reports</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Function Name *</Label>
              <Input
                value={formData.function_name}
                onChange={(e) => setFormData({ ...formData, function_name: e.target.value })}
                placeholder="e.g., send_email"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Requires Human Approval</Label>
              <p className="text-xs text-slate-500">
                Tool execution will pause for manual approval
              </p>
            </div>
            <Switch
              checked={formData.requires_approval}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, requires_approval: checked })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            Create Tool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
