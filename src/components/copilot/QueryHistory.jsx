import React from 'react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { Clock, Search, Bookmark, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function groupByDate(queries) {
  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: []
  };

  queries.forEach(query => {
    const date = new Date(query.created_date);
    if (isToday(date)) groups.today.push(query);
    else if (isYesterday(date)) groups.yesterday.push(query);
    else if (isThisWeek(date)) groups.thisWeek.push(query);
    else groups.older.push(query);
  });

  return groups;
}

export default function QueryHistory({ 
  queries = [], 
  onSelect, 
  selectedId,
  filter = 'all',
  onFilterChange,
  searchQuery = '',
  onSearchChange
}) {
  const filteredQueries = queries.filter(q => {
    if (filter === 'saved' && !q.is_saved) return false;
    if (searchQuery && !q.prompt.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const groups = groupByDate(filteredQueries);

  const renderGroup = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide px-3 mb-2">
          {title}
        </h3>
        <div className="space-y-1">
          {items.map((query) => (
            <button
              key={query.id}
              onClick={() => onSelect?.(query)}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-2 rounded-xl text-left transition-all",
                selectedId === query.id 
                  ? "bg-slate-100" 
                  : "hover:bg-slate-50"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm truncate",
                  selectedId === query.id ? "text-slate-900 font-medium" : "text-slate-700"
                )}>
                  {query.prompt}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">
                    {format(new Date(query.created_date), 'h:mm a')}
                  </span>
                  {query.is_saved && (
                    <Bookmark className="h-3 w-3 text-amber-500 fill-amber-500" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">History</h2>
          <Badge variant="secondary" className="ml-auto text-xs">
            {queries.length}
          </Badge>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search queries..."
            className="pl-9 h-9 text-sm bg-slate-50 border-slate-200"
          />
        </div>

        <div className="flex gap-1 mt-3">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange?.('all')}
            className="h-7 text-xs"
          >
            All
          </Button>
          <Button
            variant={filter === 'saved' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange?.('saved')}
            className="h-7 text-xs"
          >
            <Bookmark className="h-3 w-3 mr-1" />
            Saved
          </Button>
        </div>
      </div>

      {/* Query List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredQueries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No queries yet</p>
              <p className="text-xs text-slate-400 mt-1">Your history will appear here</p>
            </div>
          ) : (
            <>
              {renderGroup('Today', groups.today)}
              {renderGroup('Yesterday', groups.yesterday)}
              {renderGroup('This Week', groups.thisWeek)}
              {renderGroup('Older', groups.older)}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}