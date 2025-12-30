import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Command, Clock, FileText, Users, Settings, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SEARCH_CATEGORIES = [
  { id: 'queries', label: 'Queries', icon: FileText },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function GlobalSearch({ 
  open, 
  onOpenChange, 
  onSearch,
  recentSearches = [],
  results = null 
}) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setActiveCategory('all');
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const handleSearch = (searchQuery) => {
    onSearch?.(searchQuery, activeCategory);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="Search queries, members, settings..."
            className="border-0 shadow-none p-0 h-auto text-base focus-visible:ring-0"
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 text-slate-500 rounded">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1 px-4 py-2 border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-colors",
              activeCategory === 'all' 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-600 hover:bg-white/50"
            )}
          >
            All
          </button>
          {SEARCH_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5",
                activeCategory === cat.id 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-600 hover:bg-white/50"
              )}
            >
              <cat.icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results or Recent */}
        <div className="max-h-80 overflow-y-auto p-2">
          {!query && recentSearches.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide px-3 mb-2">
                Recent
              </p>
              {recentSearches.slice(0, 5).map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(item);
                    handleSearch(item);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-left"
                >
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{item}</span>
                </button>
              ))}
            </div>
          )}

          {results && results.length > 0 && (
            <div>
              {results.map((result, i) => (
                <button
                  key={i}
                  onClick={() => {
                    result.onClick?.();
                    onOpenChange(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-left group"
                >
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    {result.icon ? <result.icon className="h-4 w-4 text-slate-500" /> : <FileText className="h-4 w-4 text-slate-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{result.title}</p>
                    {result.description && (
                      <p className="text-xs text-slate-500 truncate">{result.description}</p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}

          {query && (!results || results.length === 0) && (
            <div className="text-center py-8">
              <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No results for "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}