import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, UserCircle, Zap, Wrench, Plus, X } from 'lucide-react';

const STEPS = [
  { id: 'basics',       label: 'Basics',       icon: UserCircle, description: 'Name and purpose' },
  { id: 'persona',      label: 'Persona',       icon: UserCircle, description: 'Role and tone' },
  { id: 'capabilities', label: 'Capabilities',  icon: Zap,        description: 'What it can do' },
  { id: 'review',       label: 'Review',        icon: Check,      description: 'Confirm & create' },
];

const TONES = [
  { value: 'professional', label: 'Professional', desc: 'Formal and precise' },
  { value: 'friendly',     label: 'Friendly',     desc: 'Warm and approachable' },
  { value: 'concise',      label: 'Concise',      desc: 'Short and to the point' },
  { value: 'detailed',     label: 'Detailed',     desc: 'Thorough explanations' },
];

const CAPABILITIES = [
  { value: 'web_search',        label: 'Web Search',         desc: 'Search the internet for current info' },
  { value: 'entity_crud',       label: 'Database Ops',       desc: 'Read and write app data' },
  { value: 'api_calls',         label: 'External APIs',      desc: 'Call third-party services' },
  { value: 'data_analysis',     label: 'Data Analysis',      desc: 'Analyze and interpret data' },
  { value: 'email',             label: 'Send Emails',        desc: 'Compose and send emails' },
  { value: 'multi_step_planning', label: 'Multi-step Plans', desc: 'Break tasks into subtasks' },
];

function StepIndicator({ currentStep }) {
  const currentIdx = STEPS.findIndex(s => s.id === currentStep);
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                'h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all',
                done   ? 'bg-slate-900 border-slate-900 text-white' :
                active ? 'border-slate-900 bg-white text-slate-900' :
                         'border-slate-200 bg-white text-slate-400'
              )}>
                {done ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
              </div>
              <span className={cn('text-xs font-medium hidden sm:block',
                active ? 'text-slate-900' : done ? 'text-slate-500' : 'text-slate-400'
              )}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-2 mb-5', done ? 'bg-slate-900' : 'bg-slate-200')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function AgentCreationWizard({ open, onOpenChange, onCreate, isCreating }) {
  const [step, setStep] = useState('basics');
  const [data, setData] = useState({
    name: '',
    description: '',
    persona: { role: '', tone: 'professional', expertise_areas: [], custom_instructions: '' },
    capabilities: ['web_search', 'multi_step_planning'],
  });
  const [newExpertise, setNewExpertise] = useState('');

  const set = (path, value) => {
    if (path.startsWith('persona.')) {
      const field = path.replace('persona.', '');
      setData(d => ({ ...d, persona: { ...d.persona, [field]: value } }));
    } else {
      setData(d => ({ ...d, [path]: value }));
    }
  };

  const toggleCapability = (cap) => {
    setData(d => ({
      ...d,
      capabilities: d.capabilities.includes(cap)
        ? d.capabilities.filter(c => c !== cap)
        : [...d.capabilities, cap],
    }));
  };

  const addExpertise = () => {
    if (!newExpertise.trim()) return;
    set('persona.expertise_areas', [...data.persona.expertise_areas, newExpertise.trim()]);
    setNewExpertise('');
  };

  const removeExpertise = (item) => {
    set('persona.expertise_areas', data.persona.expertise_areas.filter(e => e !== item));
  };

  const canAdvance = () => {
    if (step === 'basics') return data.name.trim().length > 0;
    if (step === 'persona') return data.persona.role.trim().length > 0;
    if (step === 'capabilities') return data.capabilities.length > 0;
    return true;
  };

  const nextStep = () => {
    const idx = STEPS.findIndex(s => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  };

  const prevStep = () => {
    const idx = STEPS.findIndex(s => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  };

  const handleCreate = () => onCreate(data);

  const handleClose = (v) => {
    if (!v) {
      setStep('basics');
      setData({ name: '', description: '', persona: { role: '', tone: 'professional', expertise_areas: [], custom_instructions: '' }, capabilities: ['web_search', 'multi_step_planning'] });
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
        </DialogHeader>

        <StepIndicator currentStep={step} />

        {/* Step: Basics */}
        {step === 'basics' && (
          <div className="space-y-4">
            <div>
              <Label>Agent Name <span className="text-red-500">*</span></Label>
              <Input
                autoFocus
                value={data.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g., Data Analysis Agent"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Description <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
              <Textarea
                value={data.description}
                onChange={e => set('description', e.target.value)}
                placeholder="What will this agent help with?"
                rows={3}
                className="mt-1.5"
              />
            </div>
          </div>
        )}

        {/* Step: Persona */}
        {step === 'persona' && (
          <div className="space-y-4">
            <div>
              <Label>Role <span className="text-red-500">*</span></Label>
              <Input
                autoFocus
                value={data.persona.role}
                onChange={e => set('persona.role', e.target.value)}
                placeholder="e.g., Data Analyst, Customer Support"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="mb-2 block">Tone</Label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set('persona.tone', t.value)}
                    className={cn(
                      'p-3 rounded-lg border-2 text-left transition-all',
                      data.persona.tone === t.value
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <p className="text-sm font-medium text-slate-800">{t.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Expertise Areas <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={newExpertise}
                  onChange={e => setNewExpertise(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                  placeholder="e.g., SQL, Finance"
                />
                <Button type="button" size="sm" variant="outline" onClick={addExpertise}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {data.persona.expertise_areas.map(area => (
                  <Badge key={area} variant="secondary" className="gap-1">
                    {area}
                    <button onClick={() => removeExpertise(area)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Custom Instructions <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
              <Textarea
                value={data.persona.custom_instructions}
                onChange={e => set('persona.custom_instructions', e.target.value)}
                placeholder="Any special behavioral instructions..."
                rows={2}
                className="mt-1.5"
              />
            </div>
          </div>
        )}

        {/* Step: Capabilities */}
        {step === 'capabilities' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Select what this agent is allowed to do. You can change these later.</p>
            <div className="grid grid-cols-1 gap-2">
              {CAPABILITIES.map(cap => {
                const active = data.capabilities.includes(cap.value);
                return (
                  <button
                    key={cap.value}
                    type="button"
                    onClick={() => toggleCapability(cap.value)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all',
                      active ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className={cn(
                      'h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                      active ? 'bg-slate-900 border-slate-900' : 'border-slate-300'
                    )}>
                      {active && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{cap.label}</p>
                      <p className="text-xs text-slate-500">{cap.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              <div className="p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Agent</p>
                <p className="text-sm font-semibold text-slate-900">{data.name}</p>
                {data.description && <p className="text-xs text-slate-500 mt-0.5">{data.description}</p>}
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Persona</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{data.persona.role}</Badge>
                  <Badge variant="outline">{data.persona.tone}</Badge>
                  {data.persona.expertise_areas.map(a => <Badge key={a} variant="secondary">{a}</Badge>)}
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Capabilities ({data.capabilities.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.capabilities.map(c => {
                    const cap = CAPABILITIES.find(x => x.value === c);
                    return <Badge key={c} variant="secondary">{cap?.label || c}</Badge>;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
          <Button variant="ghost" onClick={prevStep} disabled={step === 'basics'}>
            Back
          </Button>
          {step !== 'review' ? (
            <Button onClick={nextStep} disabled={!canAdvance()}>
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Agent'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}