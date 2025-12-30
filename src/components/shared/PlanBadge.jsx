import React from 'react';
import { Sparkles, Zap, Users, Building2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLAN_CONFIG = {
  free: { 
    label: 'Free', 
    icon: Sparkles, 
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    features: ['100 queries/month', '1 user', 'Basic support']
  },
  pro: { 
    label: 'Pro', 
    icon: Zap, 
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    features: ['1,000 queries/month', '5 users', 'Priority support']
  },
  team: { 
    label: 'Team', 
    icon: Users, 
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    features: ['10,000 queries/month', '25 users', 'SSO', 'Advanced analytics']
  },
  enterprise: { 
    label: 'Enterprise', 
    icon: Building2, 
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    features: ['Unlimited queries', 'Unlimited users', 'SLA', 'Dedicated support']
  },
};

export default function PlanBadge({ plan = 'free', showFeatures = false, className }) {
  const config = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
  const PlanIcon = config.icon;

  return (
    <div className={className}>
      <Badge variant="outline" className={cn("text-xs font-medium", config.color)}>
        <PlanIcon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
      
      {showFeatures && (
        <ul className="mt-2 space-y-1">
          {config.features.map((feature, i) => (
            <li key={i} className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              {feature}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}