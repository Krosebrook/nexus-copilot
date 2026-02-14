import React from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, User, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function DetailsPanel({
  title,
  subtitle,
  badges = [],
  metadata = [],
  tabs,
  onClose,
  className,
  children
}) {
  return (
    <div className={cn("w-96 border-l border-slate-200 bg-white flex flex-col", className)}>
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
            )}
            {badges.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {badges.map((badge, idx) => (
                  <Badge key={idx} variant={badge.variant || "secondary"}>
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="ml-2">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Metadata */}
        {metadata.length > 0 && (
          <div className="mt-4 space-y-2">
            {metadata.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                {item.icon && <item.icon className="h-3.5 w-3.5 text-slate-400" />}
                <span className="font-medium">{item.label}:</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {tabs ? (
          <Tabs defaultValue={tabs[0]?.value} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent px-4">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="p-4">
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="p-4">{children}</div>
        )}
      </div>
    </div>
  );
}