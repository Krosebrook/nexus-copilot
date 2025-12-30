import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, FileText, Users, ArrowRight } from 'lucide-react';

const SUGGESTIONS = [
  { icon: FileText, text: "Summarize our Q4 objectives", category: "Summary" },
  { icon: Users, text: "What decisions were made in the last standup?", category: "Recall" },
  { icon: Zap, text: "Extract action items from recent meeting notes", category: "Extract" },
];

export default function EmptyState({ onSuggestionClick }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center mb-6 shadow-lg"
      >
        <Sparkles className="h-8 w-8 text-white" />
      </motion.div>

      <h2 className="text-xl font-semibold text-slate-900 mb-2">
        Your AI Copilot
      </h2>
      <p className="text-sm text-slate-500 text-center max-w-sm mb-8">
        Ask questions, get summaries, and extract insights. Your team's knowledge, instantly accessible.
      </p>

      <div className="w-full max-w-md space-y-2">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
          Try asking
        </p>
        {SUGGESTIONS.map((suggestion, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onSuggestionClick?.(suggestion.text)}
            className="w-full flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl text-left hover:border-slate-300 hover:shadow-sm transition-all group"
          >
            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-200 transition-colors">
              <suggestion.icon className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 truncate">{suggestion.text}</p>
              <p className="text-xs text-slate-400">{suggestion.category}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
        <kbd className="px-2 py-1 bg-slate-100 rounded font-mono">⌘</kbd>
        <span>+</span>
        <kbd className="px-2 py-1 bg-slate-100 rounded font-mono">K</kbd>
        <span className="ml-1">to focus input anytime</span>
      </div>
    </motion.div>
  );
}