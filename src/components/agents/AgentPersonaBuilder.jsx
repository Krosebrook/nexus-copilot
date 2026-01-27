import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCircle, Plus, X } from 'lucide-react';

const CAPABILITY_OPTIONS = [
  { value: 'web_search', label: 'Web Search' },
  { value: 'entity_crud', label: 'Database Operations' },
  { value: 'api_calls', label: 'External API Calls' },
  { value: 'data_analysis', label: 'Data Analysis' },
  { value: 'email', label: 'Send Emails' },
  { value: 'multi_step_planning', label: 'Multi-step Planning' },
];

export default function AgentPersonaBuilder({ agent, onUpdate }) {
  const [persona, setPersona] = useState(agent?.persona || {
    role: '',
    tone: 'professional',
    expertise_areas: [],
    custom_instructions: ''
  });
  const [capabilities, setCapabilities] = useState(agent?.capabilities || []);
  const [newExpertise, setNewExpertise] = useState('');

  const handleUpdate = (field, value) => {
    const updated = { ...persona, [field]: value };
    setPersona(updated);
    onUpdate({ persona: updated, capabilities });
  };

  const addExpertise = () => {
    if (newExpertise.trim()) {
      const updated = [...(persona.expertise_areas || []), newExpertise.trim()];
      setPersona({ ...persona, expertise_areas: updated });
      onUpdate({ persona: { ...persona, expertise_areas: updated }, capabilities });
      setNewExpertise('');
    }
  };

  const removeExpertise = (item) => {
    const updated = persona.expertise_areas.filter(e => e !== item);
    setPersona({ ...persona, expertise_areas: updated });
    onUpdate({ persona: { ...persona, expertise_areas: updated }, capabilities });
  };

  const toggleCapability = (capability) => {
    const updated = capabilities.includes(capability)
      ? capabilities.filter(c => c !== capability)
      : [...capabilities, capability];
    setCapabilities(updated);
    onUpdate({ persona, capabilities: updated });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCircle className="h-4 w-4" />
            Agent Persona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Input
              value={persona.role || ''}
              onChange={(e) => handleUpdate('role', e.target.value)}
              placeholder="e.g., Data Analyst, Customer Support Specialist"
            />
          </div>

          <div className="space-y-2">
            <Label>Tone</Label>
            <Select
              value={persona.tone || 'professional'}
              onValueChange={(value) => handleUpdate('tone', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Expertise Areas</Label>
            <div className="flex gap-2">
              <Input
                value={newExpertise}
                onChange={(e) => setNewExpertise(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                placeholder="Add area of expertise"
              />
              <Button type="button" size="sm" onClick={addExpertise}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {persona.expertise_areas?.map((area) => (
                <Badge key={area} variant="secondary" className="gap-1">
                  {area}
                  <button onClick={() => removeExpertise(area)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custom Instructions</Label>
            <Textarea
              value={persona.custom_instructions || ''}
              onChange={(e) => handleUpdate('custom_instructions', e.target.value)}
              placeholder="Additional behavioral instructions for the agent..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {CAPABILITY_OPTIONS.map((cap) => (
              <div
                key={cap.value}
                onClick={() => toggleCapability(cap.value)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  capabilities.includes(cap.value)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-medium">{cap.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}