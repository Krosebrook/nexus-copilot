import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function ProcessingIndicator({ message = "Thinking..." }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-2xl"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center"
        >
          <Sparkles className="h-4 w-4 text-white" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 rounded-xl bg-slate-900/20 blur-sm"
        />
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-700">{message}</p>
        <div className="flex gap-1 mt-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="h-1 w-1 rounded-full bg-slate-400"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}