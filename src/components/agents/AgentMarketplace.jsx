import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Store, Download, Star, TrendingUp, Search, Filter,
  Users, Sparkles, Shield, ArrowRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'support', label: 'Customer Support' },
  { value: 'automation', label: 'Automation' }
];

export default function AgentMarketplace({ orgId, onInstall }) {
  const [activeTab, setActiveTab] = useState('public');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch public templates
  const { data: publicTemplates = [] } = useQuery({
    queryKey: ['agent-templates', 'public'],
    queryFn: () => base44.entities.AgentTemplate.filter({ visibility: 'public' })
  });

  // Fetch org templates
  const { data: orgTemplates = [] } = useQuery({
    queryKey: ['agent-templates', 'org', orgId],
    queryFn: () => base44.entities.AgentTemplate.filter({ 
      $or: [
        { author_org_id: orgId },
        { visibility: 'org' }
      ]
    }),
    enabled: !!orgId
  });

  const installMutation = useMutation({
    mutationFn: async (template) => {
      // Create agent from template
      const newAgent = await base44.entities.Agent.create({
        org_id: orgId,
        name: template.name,
        description: template.description,
        ...template.agent_config,
        template_id: template.id,
        status: 'active',
        performance_metrics: {
          total_executions: 0,
          success_rate: 0,
          avg_execution_time_ms: 0,
          user_satisfaction_avg: 0
        }
      });

      // Update template install count
      await base44.entities.AgentTemplate.update(template.id, {
        install_count: (template.install_count || 0) + 1
      });

      return newAgent;
    },
    onSuccess: (agent) => {
      toast.success(`Agent installed: ${agent.name}`);
      setDetailsOpen(false);
      setSelectedTemplate(null);
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent-templates'] });
      if (onInstall) onInstall(agent);
    }
  });

  const templates = activeTab === 'public' ? publicTemplates : orgTemplates;
  
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleViewDetails = (template) => {
    setSelectedTemplate(template);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Store className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Agent Marketplace</h3>
          <p className="text-sm text-slate-500">
            Discover and install pre-built AI agents
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents..."
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="public">
            <Sparkles className="h-4 w-4 mr-2" />
            Public Marketplace
          </TabsTrigger>
          <TabsTrigger value="org">
            <Users className="h-4 w-4 mr-2" />
            Organization Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="public" className="mt-6">
          <TemplateGrid
            templates={filteredTemplates}
            onViewDetails={handleViewDetails}
            onInstall={(template) => installMutation.mutate(template)}
            isInstalling={installMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="org" className="mt-6">
          <TemplateGrid
            templates={filteredTemplates}
            onViewDetails={handleViewDetails}
            onInstall={(template) => installMutation.mutate(template)}
            isInstalling={installMutation.isPending}
          />
        </TabsContent>
      </Tabs>

      {/* Template Details Dialog */}
      {selectedTemplate && (
        <TemplateDetailsDialog
          template={selectedTemplate}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onInstall={() => installMutation.mutate(selectedTemplate)}
          isInstalling={installMutation.isPending}
        />
      )}
    </div>
  );
}

function TemplateGrid({ templates, onViewDetails, onInstall, isInstalling }) {
  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Store className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No templates found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map(template => (
        <TemplateCard
          key={template.id}
          template={template}
          onViewDetails={onViewDetails}
          onInstall={onInstall}
          isInstalling={isInstalling}
        />
      ))}
    </div>
  );
}

function TemplateCard({ template, onViewDetails, onInstall, isInstalling }) {
  const rating = template.rating_avg || 0;
  const installs = template.install_count || 0;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader onClick={() => onViewDetails(template)}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {template.icon_url ? (
              <img src={template.icon_url} alt="" className="h-10 w-10 rounded-lg" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <CardTitle className="text-base">{template.name}</CardTitle>
              <Badge variant="secondary" className="text-xs mt-1">
                {template.category}
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {template.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
            <span className="text-xs text-slate-500">({template.rating_count || 0})</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Download className="h-3 w-3" />
            {installs} installs
          </div>
        </div>

        {template.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <Button 
          className="w-full" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onInstall(template);
          }}
          disabled={isInstalling}
        >
          <Download className="h-4 w-4 mr-2" />
          Install Agent
        </Button>
      </CardContent>
    </Card>
  );
}

function TemplateDetailsDialog({ template, open, onOpenChange, onInstall, isInstalling }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            {template.icon_url ? (
              <img src={template.icon_url} alt="" className="h-12 w-12 rounded-lg" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <DialogTitle>{template.name}</DialogTitle>
              <p className="text-sm text-slate-500 mt-1">{template.description}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-6 py-4 border-y border-slate-200">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">{(template.rating_avg || 0).toFixed(1)}</span>
            <span className="text-sm text-slate-500">({template.rating_count || 0} reviews)</span>
          </div>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-slate-400" />
            <span className="font-medium">{template.install_count || 0}</span>
            <span className="text-sm text-slate-500">installs</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-500">v{template.version || '1.0.0'}</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div>
              <h4 className="font-medium mb-2">About</h4>
              <p className="text-sm text-slate-600">{template.description}</p>
            </div>

            {template.use_cases?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Use Cases</h4>
                <ul className="space-y-2">
                  {template.use_cases.map((useCase, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <ArrowRight className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      {useCase}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {template.tags?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="capabilities" className="space-y-4 mt-4">
            <div>
              <h4 className="font-medium mb-3">Agent Capabilities</h4>
              <div className="grid grid-cols-2 gap-3">
                {template.agent_config?.capabilities?.map(cap => (
                  <div key={cap} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm">{cap.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>

            {template.agent_config?.available_tools?.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Pre-configured Tools</h4>
                <div className="space-y-2">
                  {template.agent_config.available_tools.map((tool, idx) => (
                    <div key={idx} className="p-3 border border-slate-200 rounded-lg">
                      <span className="text-sm font-medium">{tool.tool_id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4 mt-4">
            {template.reviews?.length > 0 ? (
              template.reviews.map((review, idx) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>{review.user_email[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{review.user_email}</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                No reviews yet
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onInstall} disabled={isInstalling}>
            <Download className="h-4 w-4 mr-2" />
            Install Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
