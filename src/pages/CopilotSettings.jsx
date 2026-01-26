import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, Globe, BookOpen, Eye, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

export default function CopilotSettings() {
  const [user, setUser] = useState(null);
  const [currentOrg, setCurrentOrg] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        const memberships = await base44.entities.Membership.filter({ 
          user_email: userData.email, 
          status: 'active' 
        });
        
        if (memberships.length > 0) {
          const orgs = await base44.entities.Organization.filter({ id: memberships[0].org_id });
          if (orgs.length > 0) setCurrentOrg(orgs[0]);
        }
      } catch (e) {
        console.error('Error fetching user:', e);
      }
    };
    fetchUser();
  }, []);

  const { data: preferences } = useQuery({
    queryKey: ['preferences', user?.email, currentOrg?.id],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({
        user_email: user.email,
        org_id: currentOrg.id
      });
      return prefs[0] || null;
    },
    enabled: !!user && !!currentOrg,
  });

  const { data: categories } = useQuery({
    queryKey: ['knowledge-categories', currentOrg?.id],
    queryFn: async () => {
      const articles = await base44.entities.KnowledgeBase.filter({ 
        org_id: currentOrg.id,
        is_active: true 
      });
      const cats = [...new Set(articles.map(a => a.category).filter(Boolean))];
      return cats;
    },
    enabled: !!currentOrg,
    initialData: [],
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates) => {
      if (preferences?.id) {
        return base44.entities.UserPreferences.update(preferences.id, updates);
      } else {
        return base44.entities.UserPreferences.create({
          user_email: user.email,
          org_id: currentOrg.id,
          ...updates
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast.success('Preferences updated');
    },
  });

  const handleUpdate = (field, value) => {
    updatePreferencesMutation.mutate({ [field]: value });
  };

  const toggleCategory = (category) => {
    const current = preferences?.copilot_preferred_categories || [];
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    handleUpdate('copilot_preferred_categories', updated);
  };

  if (!user || !currentOrg) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="text-sm text-slate-500 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  const defaultPrefs = {
    copilot_response_length: 'balanced',
    copilot_verbosity: 'normal',
    copilot_show_sources: true,
    copilot_enable_internet_search: false,
    copilot_show_related_articles: true,
    copilot_preferred_categories: [],
  };

  const currentPrefs = { ...defaultPrefs, ...preferences };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Copilot Settings</h1>
          </div>
          <p className="text-slate-600">Customize how Copilot responds and behaves</p>
        </div>

        <div className="space-y-6">
          {/* Response Style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-slate-600" />
                Response Style
              </CardTitle>
              <CardDescription>
                Control how Copilot formats and structures responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Response Length */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Response Length</Label>
                <RadioGroup
                  value={currentPrefs.copilot_response_length}
                  onValueChange={(value) => handleUpdate('copilot_response_length', value)}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="concise" id="concise" />
                      <div>
                        <Label htmlFor="concise" className="font-medium cursor-pointer">Concise</Label>
                        <p className="text-xs text-slate-500">Brief, to-the-point answers</p>
                      </div>
                    </div>
                    {currentPrefs.copilot_response_length === 'concise' && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="balanced" id="balanced" />
                      <div>
                        <Label htmlFor="balanced" className="font-medium cursor-pointer">Balanced</Label>
                        <p className="text-xs text-slate-500">Moderate detail with examples</p>
                      </div>
                    </div>
                    {currentPrefs.copilot_response_length === 'balanced' && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="detailed" id="detailed" />
                      <div>
                        <Label htmlFor="detailed" className="font-medium cursor-pointer">Detailed</Label>
                        <p className="text-xs text-slate-500">Comprehensive explanations</p>
                      </div>
                    </div>
                    {currentPrefs.copilot_response_length === 'detailed' && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </RadioGroup>
              </div>

              {/* Verbosity */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Verbosity Level</Label>
                <RadioGroup
                  value={currentPrefs.copilot_verbosity}
                  onValueChange={(value) => handleUpdate('copilot_verbosity', value)}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="minimal" id="minimal" />
                      <div>
                        <Label htmlFor="minimal" className="font-medium cursor-pointer">Minimal</Label>
                        <p className="text-xs text-slate-500">Essential information only</p>
                      </div>
                    </div>
                    {currentPrefs.copilot_verbosity === 'minimal' && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="normal" id="normal" />
                      <div>
                        <Label htmlFor="normal" className="font-medium cursor-pointer">Normal</Label>
                        <p className="text-xs text-slate-500">Standard level of detail</p>
                      </div>
                    </div>
                    {currentPrefs.copilot_verbosity === 'normal' && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="verbose" id="verbose" />
                      <div>
                        <Label htmlFor="verbose" className="font-medium cursor-pointer">Verbose</Label>
                        <p className="text-xs text-slate-500">Thorough with context</p>
                      </div>
                    </div>
                    {currentPrefs.copilot_verbosity === 'verbose' && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-slate-600" />
                Data Sources
              </CardTitle>
              <CardDescription>
                Configure where Copilot gets information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Internet Search</Label>
                  <p className="text-xs text-slate-500">
                    Allow Copilot to search the web for up-to-date information
                  </p>
                </div>
                <Switch
                  checked={currentPrefs.copilot_enable_internet_search}
                  onCheckedChange={(checked) => handleUpdate('copilot_enable_internet_search', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Show Sources</Label>
                  <p className="text-xs text-slate-500">
                    Display which integrations and documents were used
                  </p>
                </div>
                <Switch
                  checked={currentPrefs.copilot_show_sources}
                  onCheckedChange={(checked) => handleUpdate('copilot_show_sources', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-slate-600" />
                Display Options
              </CardTitle>
              <CardDescription>
                Customize what you see in Copilot responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Show Related Articles</Label>
                  <p className="text-xs text-slate-500">
                    Display suggested knowledge base articles after each response
                  </p>
                </div>
                <Switch
                  checked={currentPrefs.copilot_show_related_articles}
                  onCheckedChange={(checked) => handleUpdate('copilot_show_related_articles', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-slate-600" />
                Preferred Knowledge Sources
              </CardTitle>
              <CardDescription>
                Select categories to prioritize in Copilot responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No categories available yet. Add articles to your knowledge base first.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const isSelected = currentPrefs.copilot_preferred_categories?.includes(category);
                    return (
                      <Badge
                        key={category}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all text-xs",
                          isSelected 
                            ? "bg-slate-900 text-white hover:bg-slate-800" 
                            : "hover:bg-slate-100"
                        )}
                        onClick={() => toggleCategory(category)}
                      >
                        {isSelected && <Check className="h-3 w-3 mr-1" />}
                        {category}
                      </Badge>
                    );
                  })}
                </div>
              )}
              {categories.length > 0 && (
                <p className="text-xs text-slate-500 mt-3">
                  {currentPrefs.copilot_preferred_categories?.length > 0
                    ? `Copilot will prioritize ${currentPrefs.copilot_preferred_categories.length} selected ${currentPrefs.copilot_preferred_categories.length === 1 ? 'category' : 'categories'}`
                    : 'Click to select preferred categories'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Settings Preview
              </CardTitle>
              <CardDescription className="text-slate-300">
                How your settings affect responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                <span>Response length: <strong>{currentPrefs.copilot_response_length}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                <span>Verbosity: <strong>{currentPrefs.copilot_verbosity}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                <span>Internet search: <strong>{currentPrefs.copilot_enable_internet_search ? 'enabled' : 'disabled'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                <span>Show sources: <strong>{currentPrefs.copilot_show_sources ? 'yes' : 'no'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                <span>Related articles: <strong>{currentPrefs.copilot_show_related_articles ? 'visible' : 'hidden'}</strong></span>
              </div>
              {currentPrefs.copilot_preferred_categories?.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                  <span>Prioritizing: <strong>{currentPrefs.copilot_preferred_categories.join(', ')}</strong></span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}