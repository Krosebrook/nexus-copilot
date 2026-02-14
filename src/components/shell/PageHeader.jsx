import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function PageHeader({
  title,
  description,
  icon: Icon,
  badge,
  actions,
  breadcrumbs,
  onBack,
  className
}) {
  return (
    <div className={cn("border-b border-slate-200 bg-white", className)}>
      <div className="px-6 py-4">
        {breadcrumbs && (
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-slate-700">
                    {crumb.label}
                  </a>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="mt-1"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            
            {Icon && (
              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-1">
                <Icon className="h-5 w-5 text-slate-600" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                {badge && (
                  <Badge variant={badge.variant || "secondary"}>
                    {badge.label}
                  </Badge>
                )}
              </div>
              {description && (
                <p className="text-sm text-slate-500 mt-1">{description}</p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}