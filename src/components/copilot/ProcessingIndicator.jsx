import React from 'react';
import { motion } from 'framer-motion';
import AIGlyph from '@/components/shared/AIGlyph';

export default function ProcessingIndicator({ message = "Thinking...", stage = "analyzing" }) {
  const stageMessages = {
    analyzing: "Analyzing your question...",
    knowledge: "Checking knowledge base...",
    integrations: "Gathering context from integrations...",
    generating: "Generating response..."
  };

  const displayMessage = stageMessages[stage] || message;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 px-6 py-4 bg-white border-0 rounded-2xl shadow-sm"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-sm"
        >
          <AIGlyph size="md" className="text-white" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-xl bg-slate-900/20 blur-md"
        />
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900">{displayMessage}</p>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="h-1.5 w-1.5 rounded-full bg-slate-400"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}