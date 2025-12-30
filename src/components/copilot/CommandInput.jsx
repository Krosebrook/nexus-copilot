import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, Command } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const QUICK_COMMANDS = [
  { label: 'Summarize', prefix: 'Summarize: ', icon: '📝' },
  { label: 'Explain', prefix: 'Explain: ', icon: '💡' },
  { label: 'Compare', prefix: 'Compare: ', icon: '⚖️' },
  { label: 'Action items', prefix: 'Extract action items from: ', icon: '✅' },
];

export default function CommandInput({ 
  onSubmit, 
  isProcessing = false, 
  placeholder = "Ask anything...",
  disabled = false 
}) {
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isProcessing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isProcessing]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isProcessing || disabled) return;
    onSubmit(input.trim());
    setInput('');
    setShowCommands(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === '/' && !input) {
      setShowCommands(true);
    }
    if (e.key === 'Escape') {
      setShowCommands(false);
    }
  };

  const applyCommand = (prefix) => {
    setInput(prefix);
    setShowCommands(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {showCommands && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-10">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Quick Commands</span>
          </div>
          <div className="p-1">
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd.label}
                onClick={() => applyCommand(cmd.prefix)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="text-lg">{cmd.icon}</span>
                <span className="text-sm font-medium text-slate-700">{cmd.label}</span>
                <span className="ml-auto text-xs text-slate-400 font-mono">{cmd.prefix}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className={cn(
          "flex items-center gap-3 bg-white border-2 rounded-2xl px-4 py-3 transition-all duration-200",
          isProcessing ? "border-slate-200 bg-slate-50" : "border-slate-200 hover:border-slate-300 focus-within:border-slate-900 focus-within:shadow-sm"
        )}>
          <Command className="h-4 w-4 text-slate-400 flex-shrink-0" />
          
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => !input && setShowCommands(true)}
            onBlur={() => setTimeout(() => setShowCommands(false), 150)}
            placeholder={placeholder}
            disabled={isProcessing || disabled}
            className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm outline-none disabled:opacity-50"
          />

          <div className="flex items-center gap-2 flex-shrink-0">
            {!isProcessing && input && (
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono text-slate-400 bg-slate-100 rounded">
                ↵
              </kbd>
            )}
            
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isProcessing || disabled}
              className={cn(
                "h-8 w-8 p-0 rounded-xl transition-all",
                input.trim() && !isProcessing 
                  ? "bg-slate-900 hover:bg-slate-800 text-white" 
                  : "bg-slate-100 text-slate-400"
              )}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {!input && !showCommands && (
          <div className="absolute -bottom-6 left-4 flex items-center gap-1 text-xs text-slate-400">
            <span>Type</span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">/</kbd>
            <span>for commands</span>
          </div>
        )}
      </form>
    </div>
  );
}