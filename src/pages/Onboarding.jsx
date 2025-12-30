import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Building2, Users, Zap, ArrowRight, 
  ArrowLeft, Check, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'workspace', title: 'Create Workspace' },
  { id: 'complete', title: 'All Set' },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Check if user already has an org
        const memberships = await base44.entities.Membership.filter({ 
          user_email: userData.email, 
          status: 'active' 
        });
        
        if (memberships.length > 0) {
          navigate(createPageUrl('Dashboard'));
        }
      } catch (e) {
        // Not logged in
        base44.auth.redirectToLogin();
      }
    };
    checkUser();
  }, [navigate]);

  const createWorkspace = async () => {
    if (!workspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }

    setLoading(true);
    try {
      // Create organization
      const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
      const org = await base44.entities.Organization.create({
        name: workspaceName,
        slug: slug + '-' + Date.now().toString(36),
        plan: 'free',
        owner_email: user.email,
        status: 'active',
        feature_flags: {
          ai_queries: true,
          integrations: false,
          advanced_analytics: false,
        },
        monthly_query_limit: 100,
      });

      // Create owner membership
      await base44.entities.Membership.create({
        org_id: org.id,
        user_email: user.email,
        role: 'owner',
        status: 'active',
        accepted_at: new Date().toISOString(),
      });

      // Create initial audit log
      await base44.entities.AuditLog.create({
        org_id: org.id,
        actor_email: user.email,
        action: 'org_created',
        action_category: 'admin',
        resource_type: 'Organization',
        resource_id: org.id,
        status: 'success',
      });

      setCurrentStep(2);
    } catch (error) {
      toast.error('Failed to create workspace');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const goToApp = () => {
    navigate(createPageUrl('Dashboard'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium transition-all ${
                index < currentStep 
                  ? 'bg-slate-900 text-white' 
                  : index === currentStep 
                    ? 'bg-slate-900 text-white ring-4 ring-slate-900/20' 
                    : 'bg-slate-200 text-slate-500'
              }`}>
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`h-0.5 w-12 transition-all ${
                  index < currentStep ? 'bg-slate-900' : 'bg-slate-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-xl p-8 text-center"
            >
              <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 mb-3">
                Welcome to AI Copilot
              </h1>
              <p className="text-slate-600 mb-8">
                Your team's intelligent assistant for faster thinking and better alignment.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl text-left">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Instant Answers</p>
                    <p className="text-sm text-slate-500">Get quick summaries and insights</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl text-left">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Team Collaboration</p>
                    <p className="text-sm text-slate-500">Share knowledge across your team</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setCurrentStep(1)} 
                className="w-full bg-slate-900 hover:bg-slate-800 h-12"
              >
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-xl p-8"
            >
              <button 
                onClick={() => setCurrentStep(0)}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-6">
                <Building2 className="h-6 w-6 text-slate-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Create Your Workspace
              </h1>
              <p className="text-slate-600 mb-8">
                This is where your team will collaborate. You can invite others later.
              </p>

              <div className="space-y-4 mb-8">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Acme Inc."
                    className="h-12"
                    disabled={loading}
                  />
                  <p className="text-xs text-slate-500">
                    Usually your company or team name
                  </p>
                </div>
              </div>

              <Button 
                onClick={createWorkspace} 
                disabled={!workspaceName.trim() || loading}
                className="w-full bg-slate-900 hover:bg-slate-800 h-12"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Workspace
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-xl p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
              >
                <Check className="h-8 w-8 text-green-600" />
              </motion.div>
              
              <h1 className="text-2xl font-bold text-slate-900 mb-3">
                You're All Set!
              </h1>
              <p className="text-slate-600 mb-8">
                Your workspace is ready. Start by asking your first question.
              </p>

              <Button 
                onClick={goToApp} 
                className="w-full bg-slate-900 hover:bg-slate-800 h-12"
              >
                Open Copilot
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}