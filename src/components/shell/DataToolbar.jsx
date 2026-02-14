import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, SlidersHorizontal, Download, RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function DataToolbar({
  searchValue,
  onSearchChange,
  filters = [],
  selectedFilters = {},
  onFilterChange,
  actions,
  resultCount,
  onRefresh,
  onExport,
  className
}) {
  return (
    <div className={cn("border-b border-slate-200 bg-white", className)}>
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          {filters.length > 0 && (
            <>
              {filters.map((filter) => (
                <Select
                  key={filter.key}
                  value={selectedFilters[filter.key] || 'all'}
                  onValueChange={(value) => onFilterChange?.(filter.key, value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {filter.label}</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {resultCount !== undefined && (
            <Badge variant="secondary" className="font-normal">
              {resultCount} {resultCount === 1 ? 'item' : 'items'}
            </Badge>
          )}

          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          {onExport && (
            <Button variant="ghost" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}

          {actions}
        </div>
      </div>
    </div>
  );
}