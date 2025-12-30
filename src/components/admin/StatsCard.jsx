import React from 'react';
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatsCard({ 
  title, 
  value, 
  change, 
  changeLabel,
  icon: Icon,
  className 
}) {
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  
  return (
    <div className={cn(
      "bg-white border border-slate-200 rounded-2xl p-5 transition-all hover:shadow-sm",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
          {Icon && <Icon className="h-5 w-5 text-slate-600" />}
        </div>
        {typeof change === 'number' && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend === 'up' && "bg-green-50 text-green-700",
            trend === 'down' && "bg-red-50 text-red-700",
            trend === 'neutral' && "bg-slate-50 text-slate-600"
          )}>
            {trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3" />}
            {trend === 'neutral' && <Minus className="h-3 w-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{title}</p>
        {changeLabel && (
          <p className="text-xs text-slate-400">{changeLabel}</p>
        )}
      </div>
    </div>
  );
}