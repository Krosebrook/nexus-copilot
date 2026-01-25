import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateOrgStep({ onNext, initialData = {} }) {
  const [orgName, setOrgName] = useState(initialData.orgName || '');
  const [plan, setPlan] = useState(initialData.plan || 'free');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    onNext({ orgName, plan });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Your Workspace</h2>
        <p className="text-slate-600">Let's set up your organization to get started</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">Workspace Name *</Label>
          <Input
            id="org-name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Acme Corp"
            required
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan">Plan</Label>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger id="plan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free - Up to 100 queries/month</SelectItem>
              <SelectItem value="pro">Pro - Unlimited queries</SelectItem>
              <SelectItem value="team">Team - Advanced collaboration</SelectItem>
              <SelectItem value="enterprise">Enterprise - Custom limits</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg">
        Continue
      </Button>
    </form>
  );
}