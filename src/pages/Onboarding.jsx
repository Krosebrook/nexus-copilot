import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import StepIndicator from '@/components/onboarding/StepIndicator';
import CreateOrgStep from '@/components/onboarding/CreateOrgStep';
import InviteMembersStep from '@/components/onboarding/InviteMembersStep';
import ConnectIntegrationsStep from '@/components/onboarding/ConnectIntegrationsStep';
import CompletionStep from '@/components/onboarding/CompletionStep';

const STEPS = [
  { id: 'org', title: 'Workspace', component: CreateOrgStep },
  { id: 'members', title: 'Team', component: InviteMembersStep },
  { id: 'integrations', title: 'Integrations', component: ConnectIntegrationsStep },
  { id: 'complete', title: 'Complete', component: CompletionStep },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({});
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingOrg = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Check if user already has an org
        const memberships = await base44.entities.Membership.filter({ 
          user_email: userData.email,
          status: 'active'
        });
        
        if (memberships.length > 0) {
          // User already has org, redirect to dashboard
          navigate(createPageUrl('Dashboard'));
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkExistingOrg();
  }, [navigate]);

  const handleNext = async (stepData) => {
    const updatedData = { ...onboardingData, ...stepData };
    setOnboardingData(updatedData);

    // If completing org step, create the org
    if (currentStep === 0) {
      setIsProcessing(true);
      try {
        const slug = stepData.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const org = await base44.entities.Organization.create({
          name: stepData.orgName,
          slug,
          plan: stepData.plan,
          owner_email: user.email,
          status: 'active',
        });

        // Create membership for creator as owner
        await base44.entities.Membership.create({
          org_id: org.id,
          user_email: user.email,
          role: 'owner',
          status: 'active',
        });

        // Create default preferences
        await base44.entities.UserPreferences.create({
          user_email: user.email,
          org_id: org.id,
        });

        setOnboardingData({ ...updatedData, orgId: org.id });
        setCurrentStep(currentStep + 1);
      } catch (e) {
        toast.error('Failed to create workspace');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // If completing members step, send invites
    if (currentStep === 1 && stepData.invites?.length > 0) {
      setIsProcessing(true);
      try {
        for (const invite of stepData.invites) {
          await base44.entities.Membership.create({
            org_id: onboardingData.orgId,
            user_email: invite.email,
            role: invite.role,
            status: 'invited',
            invited_by: user.email,
          });

          try {
            await base44.users.inviteUser(invite.email, invite.role === 'admin' ? 'admin' : 'user');
          } catch (e) {
            // User might already exist
          }
        }
        toast.success(`Invited ${stepData.invites.length} member${stepData.invites.length > 1 ? 's' : ''}`);
      } catch (e) {
        toast.error('Failed to send invitations');
      } finally {
        setIsProcessing(false);
      }
    }

    // If completing integrations step, create integration records
    if (currentStep === 2 && stepData.selectedIntegrations?.length > 0) {
      setIsProcessing(true);
      try {
        for (const integrationType of stepData.selectedIntegrations) {
          await base44.entities.Integration.create({
            org_id: onboardingData.orgId,
            type: integrationType,
            name: integrationType.charAt(0).toUpperCase() + integrationType.slice(1),
            status: 'pending_auth',
          });
        }
        toast.success('Integrations added - configure them in Settings');
      } catch (e) {
        toast.error('Failed to add integrations');
      } finally {
        setIsProcessing(false);
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const handleSkip = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleComplete = () => {
    navigate(createPageUrl('Dashboard'));
  };

  const StepComponent = STEPS[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to AI Copilot</h1>
          <p className="text-slate-600">Let's get you set up in just a few steps</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <StepIndicator steps={STEPS} currentStep={currentStep} />
          
          {isProcessing ? (
            <div className="text-center py-12">
              <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-600">Setting up your workspace...</p>
            </div>
          ) : (
            <StepComponent
              onNext={handleNext}
              onSkip={handleSkip}
              onComplete={handleComplete}
              initialData={onboardingData}
              orgName={onboardingData.orgName}
            />
          )}
        </div>
      </div>
    </div>
  );
}