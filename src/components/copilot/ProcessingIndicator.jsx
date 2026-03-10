import React from 'react';
import { motion } from 'framer-motion';
import AIGlyph from '@/components/shared/AIGlyph';

// Skeleton that matches the shape of a ResponseCard — reduces perceived latency
export default function ProcessingIndicator({ message = "Thinking..." }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="bg-white rounded-2xl shadow-sm p-4"
    >
      {/* User prompt echo */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
          <AIGlyph size="sm" className="text-white" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-slate-100 rounded-full w-3/4 animate-pulse" />
          <div className="h-2.5 bg-slate-100 rounded-full w-1/2 animate-pulse" />
        </div>
      </div>

      {/* Response skeleton lines */}
      <div className="space-y-2 pl-11">
        <div className="h-3 bg-slate-100 rounded-full w-full animate-pulse" style={{ animationDelay: '0ms' }} />
        <div className="h-3 bg-slate-100 rounded-full w-5/6 animate-pulse" style={{ animationDelay: '75ms' }} />
        <div className="h-3 bg-slate-100 rounded-full w-4/6 animate-pulse" style={{ animationDelay: '150ms' }} />
        <div className="h-3 bg-slate-100 rounded-full w-full animate-pulse" style={{ animationDelay: '225ms' }} />
        <div className="h-3 bg-slate-100 rounded-full w-2/3 animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>

      {/* Processing label */}
      <div className="flex items-center gap-2 mt-4 pl-11">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            className="h-1.5 w-1.5 rounded-full bg-slate-400"
          />
        ))}
        <span className="text-xs text-slate-400 ml-1">{message}</span>
      </div>
    </motion.div>
  );
}