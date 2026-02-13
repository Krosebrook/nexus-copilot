import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare, Palette, Zap, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AIGlyph from '@/components/shared/AIGlyph';

export default function CopilotSettings() {
  const [user, setUser] = useState(null);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [preferences, setPreferences] = useState(null);
  
  const queryClient = useQueryClient();

  // Fetch user, org, and preferences
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        const memberships = await base44.entities.Membership.filter({ 
          user_email: userData.email, 
          status: 'active' 
        });
        if (memberships.length > 0) {
          const orgs = await base44.entities.Organization.filter({ id: memberships[0].org_id });
          if (orgs.length > 0) {
            setCurrentOrg(orgs[0]);
            
            // Load preferences
            const prefs = await base44.entities.UserPreferences.filter({ 
              user_email: userData.email, 
              org_id: orgs[0].id 
            });
            if (prefs.length > 0) {
              setPreferences(prefs[0]);
            } else {
              // Create default preferences
              const newPrefs = await base44.entities.UserPreferences.create({
                user_email: userData.email,
                org_id: orgs[0].id,
              });
              setPreferences(newPrefs);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  // Fetch integrations
  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.Integration.filter({ org_id: currentOrg.id, status: 'active' }) : [],
    enabled: !!currentOrg,
  });

  // Fetch knowledge base
  const { data: knowledgeBase = [] } = useQuery({
    queryKey: ['knowledge', currentOrg?.id],
    queryFn: () => currentOrg ? base44.entities.KnowledgeBase.filter({ org_id: currentOrg.id, is_active: true }) : [],
    enabled: !!currentOrg,
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.UserPreferences.update(preferences.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast.success('Saved', {
        description: 'Preferences updated successfully',
        duration: 2000
      });
    },
    onError: (error) => {
      toast.error('Failed to save', {
        description: error.message || 'Please try again',
        duration: 3000
      });
    },
  });

  const handleUpdatePreference = (key, value) => {
    setPreferences({ ...preferences, [key]: value });
    updatePreferencesMutation.mutate({ [key]: value });
  };

  const toggleIntegrationPriority = (integrationId) => {
    const current = preferences?.copilot_prioritized_integrations || [];
    const updated = current.includes(integrationId)
      ? current.filter(id => id !== integrationId)
      : [...current, integrationId];
    handleUpdatePreference('copilot_prioritized_integrations', updated);
  };

  const toggleKnowledgePriority = (articleId) => {
    const current = preferences?.copilot_prioritized_knowledge_bases || [];
    const updated = current.includes(articleId)
      ? current.filter(id => id !== articleId)
      : [...current, articleId];
    handleUpdatePreference('copilot_prioritized_knowledge_bases', updated);
  };

  if (!preferences) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AIGlyph size="xl" className="text-slate-400 mx-auto mb-3" animated />
          <p className="text-slate-500">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Button asChild variant="ghost" size="sm" className="mb-6">
            <Link to={createPageUrl('Settings')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-sm">
              <AIGlyph size="md" className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-700">Copilot Settings</h1>
              <p className="text-slate-500">Customize how your AI assistant behaves</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="behavior" className="space-y-6">
          <TabsList className="bg-white border-0 shadow-sm p-1 gap-1">
            <TabsTrigger value="behavior" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Behavior
            </TabsTrigger>
            <TabsTrigger value="sources" className="gap-2">
              <Database className="h-4 w-4" />
              Sources
            </TabsTrigger>
            <TabsTrigger value="interface" className="gap-2">
              <Palette className="h-4 w-4" />
              Interface
            </TabsTrigger>
          </TabsList>

          {/* Behavior Settings */}
          <TabsContent value="behavior" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-700">Response Style</CardTitle>
                <CardDescription>Control how Copilot communicates with you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Response Length</Label>
                  <Select 
                    value={preferences.copilot_response_length || 'balanced'} 
                    onValueChange={(v) => handleUpdatePreference('copilot_response_length', v)}
                  >
                    <SelectTrigger className="shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Concise</span>
                          <span className="text-xs text-slate-500">Brief, to-the-point answers</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="balanced">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Balanced</span>
                          <span className="text-xs text-slate-500">Mix of detail and brevity</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="detailed">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Detailed</span>
                          <span className="text-xs text-slate-500">Comprehensive explanations</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Verbosity Level</Label>
                  <Select 
                    value={preferences.copilot_verbosity || 'normal'} 
                    onValueChange={(v) => handleUpdatePreference('copilot_verbosity', v)}
                  >
                    <SelectTrigger className="shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Minimal</span>
                          <span className="text-xs text-slate-500">Less technical jargon</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="normal">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Normal</span>
                          <span className="text-xs text-slate-500">Balanced technical detail</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="verbose">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Verbose</span>
                          <span className="text-xs text-slate-500">Technical details included</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Communication Tone</Label>
                  <Select 
                    value={preferences.copilot_tone || 'professional'} 
                    onValueChange={(v) => handleUpdatePreference('copilot_tone', v)}
                  >
                    <SelectTrigger className="shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-700">Features</CardTitle>
                <CardDescription>Enable or disable Copilot capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Internet Search</Label>
                    <p className="text-sm text-slate-500">Allow Copilot to search the web for latest information</p>
                  </div>
                  <Switch
                    checked={preferences.copilot_enable_internet_search || false}
                    onCheckedChange={(v) => handleUpdatePreference('copilot_enable_internet_search', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Show Sources</Label>
                    <p className="text-sm text-slate-500">Display integrations and knowledge articles used</p>
                  </div>
                  <Switch
                    checked={preferences.copilot_show_sources !== false}
                    onCheckedChange={(v) => handleUpdatePreference('copilot_show_sources', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Related Articles</Label>
                    <p className="text-sm text-slate-500">Suggest related knowledge base articles after responses</p>
                  </div>
                  <Switch
                    checked={preferences.copilot_show_related_articles !== false}
                    onCheckedChange={(v) => handleUpdatePreference('copilot_show_related_articles', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-Save Important Queries</Label>
                    <p className="text-sm text-slate-500">Automatically save queries marked as important</p>
                  </div>
                  <Switch
                    checked={preferences.copilot_auto_save_queries || false}
                    onCheckedChange={(v) => handleUpdatePreference('copilot_auto_save_queries', v)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sources Priority */}
          <TabsContent value="sources" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-700">Prioritized Integrations</CardTitle>
                <CardDescription>Select which integrations Copilot should prioritize for context</CardDescription>
              </CardHeader>
              <CardContent>
                {integrations.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No integrations connected yet</p>
                    <Button asChild variant="outline" size="sm" className="mt-3">
                      <Link to={createPageUrl('Settings')}>Connect Integrations</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {integrations.map((integration) => (
                      <div
                        key={integration.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Database className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">{integration.name}</p>
                            <p className="text-xs text-slate-500">{integration.type}</p>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.copilot_prioritized_integrations?.includes(integration.id) || false}
                          onCheckedChange={() => toggleIntegrationPriority(integration.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-700">Prioritized Knowledge Articles</CardTitle>
                <CardDescription>Pin important articles for Copilot to reference first</CardDescription>
              </CardHeader>
              <CardContent>
                {knowledgeBase.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No knowledge articles yet</p>
                    <Button asChild variant="outline" size="sm" className="mt-3">
                      <Link to={createPageUrl('Knowledge')}>Create Articles</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-auto">
                    {knowledgeBase.map((article) => (
                      <div
                        key={article.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-slate-700">{article.title}</p>
                            {article.category && (
                              <Badge variant="outline" className="text-xs">{article.category}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1">{article.content}</p>
                        </div>
                        <Switch
                          checked={preferences.copilot_prioritized_knowledge_bases?.includes(article.id) || false}
                          onCheckedChange={() => toggleKnowledgePriority(article.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interface Settings */}
          <TabsContent value="interface" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-700">Display Preferences</CardTitle>
                <CardDescription>Customize the Copilot interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Theme</Label>
                  <Select 
                    value={preferences.ui_theme || 'light'} 
                    onValueChange={(v) => handleUpdatePreference('ui_theme', v)}
                  >
                    <SelectTrigger className="shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="high_contrast">High Contrast</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Note: Theme customization coming soon</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-slate-500">Reduce spacing and padding for denser layout</p>
                  </div>
                  <Switch
                    checked={preferences.ui_compact_mode || false}
                    onCheckedChange={(v) => handleUpdatePreference('ui_compact_mode', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Animations</Label>
                    <p className="text-sm text-slate-500">Enable smooth transitions and effects</p>
                  </div>
                  <Switch
                    checked={preferences.ui_animations_enabled !== false}
                    onCheckedChange={(v) => handleUpdatePreference('ui_animations_enabled', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Keyboard Hints</Label>
                    <p className="text-sm text-slate-500">Show keyboard shortcut suggestions</p>
                  </div>
                  <Switch
                    checked={preferences.ui_show_keyboard_hints !== false}
                    onCheckedChange={(v) => handleUpdatePreference('ui_show_keyboard_hints', v)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}