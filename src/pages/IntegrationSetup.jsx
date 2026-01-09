import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import IntegrationTypeSelector from '@/components/integrations/setup/IntegrationTypeSelector';
import IntegrationCredentials from '@/components/integrations/setup/IntegrationCredentials';
import IntegrationCapabilities from '@/components/integrations/setup/IntegrationCapabilities';
import IntegrationReview from '@/components/integrations/setup/IntegrationReview';

const STEPS = [
  { id: 'type', label: 'Select Service' },
  { id: 'credentials', label: 'Connect Account' },
  { id: 'capabilities', label: 'Configure Features' },
  { id: 'review', label: 'Review & Complete' },
];

export default function IntegrationSetup() {
  const [currentOrg, setCurrentOrg] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState({
    type: null,
    name: '',
    credentials: {},
    capabilities: [],
    config: {},
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const user = await base44.auth.me();
        const memberships = await base44.entities.Membership.filter({ 
          user_email: user.email, 
          status: 'active' 
        });
        if (memberships.length > 0) {
          const orgs = await base44.entities.Organization.filter({ id: memberships[0].org_id });
          if (orgs.length > 0) setCurrentOrg(orgs[0]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchOrg();
  }, []);

  const createIntegrationMutation = useMutation({
    mutationFn: async () => {
      const integration = await base44.entities.Integration.create({
        org_id: currentOrg.id,
        type: setupData.type,
        name: setupData.name,
        status: 'active',
        capabilities: setupData.capabilities,
        config: setupData.config,
      });

      const user = await base44.auth.me();
      await base44.entities.AuditLog.create({
        org_id: currentOrg.id,
        actor_email: user.email,
        action: 'integration_connected',
        action_category: 'integration',
        resource_type: 'Integration',
        resource_id: integration.id,
        status: 'success',
        details: { integration_type: setupData.type },
      });

      return integration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration connected successfully!');
      window.history.back();
    },
    onError: () => toast.error('Failed to connect integration'),
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      createIntegrationMutation.mutate();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return setupData.type !== null;
      case 1: return setupData.name.length > 0;
      case 2: return setupData.capabilities.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                    idx <= currentStep 
                      ? 'bg-slate-900 border-slate-900 text-white' 
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}>
                    {idx < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <p className={`text-sm mt-2 ${idx <= currentStep ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 ${idx < currentStep ? 'bg-slate-900' : 'bg-slate-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
          {currentStep === 0 && (
            <IntegrationTypeSelector
              selected={setupData.type}
              onSelect={(type, name) => setSetupData({ ...setupData, type, name })}
            />
          )}
          {currentStep === 1 && (
            <IntegrationCredentials
              integrationType={setupData.type}
              name={setupData.name}
              onUpdate={(updates) => setSetupData({ ...setupData, ...updates })}
            />
          )}
          {currentStep === 2 && (
            <IntegrationCapabilities
              integrationType={setupData.type}
              selected={setupData.capabilities}
              onUpdate={(capabilities, config) => setSetupData({ ...setupData, capabilities, config })}
            />
          )}
          {currentStep === 3 && (
            <IntegrationReview setupData={setupData} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || createIntegrationMutation.isPending}
          >
            {createIntegrationMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : currentStep === STEPS.length - 1 ? (
              'Complete Setup'
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}