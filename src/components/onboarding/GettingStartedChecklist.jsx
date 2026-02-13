import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Circle, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from "sonner";

const CHECKLIST_ITEMS = [
  {
    id: 'first_query',
    title: 'Ask your first question',
    description: 'Try the AI Copilot',
    link: 'Copilot',
    checkFn: (data) => data.queries?.length > 0
  },
  {
    id: 'invite_member',
    title: 'Invite team members',
    description: 'Collaborate with your team',
    link: 'Settings',
    checkFn: (data) => data.members?.length > 1
  },
  {
    id: 'add_knowledge',
    title: 'Add knowledge articles',
    description: 'Build your knowledge base',
    link: 'Knowledge',
    checkFn: (data) => data.knowledge?.length > 0
  },
  {
    id: 'customize_copilot',
    title: 'Customize Copilot settings',
    description: 'Personalize AI behavior',
    link: 'CopilotSettings',
    checkFn: (data) => data.preferences?.copilot_tone !== 'professional' || data.preferences?.copilot_response_length !== 'balanced'
  },
  {
    id: 'save_query',
    title: 'Save your first query',
    description: 'Bookmark important insights',
    link: 'Copilot',
    checkFn: (data) => data.queries?.some(q => q.is_saved)
  }
];

export default function GettingStartedChecklist({ orgId, userEmail }) {
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = React.useState(() => {
    return localStorage.getItem(`checklist_dismissed_${orgId}`) === 'true';
  });

  const { data: checklistData } = useQuery({
    queryKey: ['checklist-data', orgId],
    queryFn: async () => {
      const queries = await base44.entities.Query.filter({ org_id: orgId });
      const members = await base44.entities.Membership.filter({ org_id: orgId });
      const knowledge = await base44.entities.KnowledgeBase.filter({ org_id: orgId });
      const prefs = await base44.entities.UserPreferences.filter({ user_email: userEmail, org_id: orgId });
      
      return {
        queries,
        members,
        knowledge,
        preferences: prefs[0]
      };
    },
    enabled: !!orgId && !dismissed,
  });

  const completedItems = CHECKLIST_ITEMS.filter(item => 
    checklistData ? item.checkFn(checklistData) : false
  );
  const progress = (completedItems.length / CHECKLIST_ITEMS.length) * 100;
  const allComplete = completedItems.length === CHECKLIST_ITEMS.length;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(`checklist_dismissed_${orgId}`, 'true');
    toast('Checklist dismissed', {
      description: 'You can always find it in Settings',
      duration: 3000
    });
  };

  if (dismissed || allComplete) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-bold mb-2">Getting Started</CardTitle>
                <p className="text-sm text-slate-300 mb-3">
                  Complete these steps to get the most out of your workspace
                </p>
                <div className="flex items-center gap-3">
                  <Progress value={progress} className="flex-1 h-2" />
                  <span className="text-sm font-medium">{completedItems.length}/{CHECKLIST_ITEMS.length}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-white hover:bg-white/10 h-8 w-8 p-0 -mt-2 -mr-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {CHECKLIST_ITEMS.map((item) => {
                const isComplete = checklistData ? item.checkFn(checklistData) : false;
                return (
                  <Link
                    key={item.id}
                    to={createPageUrl(item.link)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-all duration-200 group"
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={cn(
                        "text-sm font-medium",
                        isComplete ? "text-slate-300 line-through" : "text-white"
                      )}>
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400">{item.description}</p>
                    </div>
                    {!isComplete && (
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                    )}
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}