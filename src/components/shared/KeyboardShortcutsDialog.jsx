import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Command } from 'lucide-react';

const shortcuts = [
  {
    category: 'Navigation',
    items: [
      { keys: ['⌘', '/'], description: 'Open Copilot' },
      { keys: ['⌘', 'K'], description: 'Global search' },
      { keys: ['⌘', '\\'], description: 'Toggle history sidebar' },
      { keys: ['Esc'], description: 'Close dialogs' },
    ]
  },
  {
    category: 'Copilot',
    items: [
      { keys: ['Enter'], description: 'Send message' },
      { keys: ['Shift', 'Enter'], description: 'New line' },
      { keys: ['/'], description: 'Quick commands' },
      { keys: ['Tab'], description: 'View suggestions' },
    ]
  },
  {
    category: 'Actions',
    items: [
      { keys: ['⌘', 'S'], description: 'Save current item' },
      { keys: ['⌘', 'C'], description: 'Copy response' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ]
  }
];

export default function KeyboardShortcutsDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-700">
            <Command className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Master these shortcuts to work faster
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors duration-200">
                    <span className="text-sm text-slate-600">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 text-slate-700 rounded shadow-sm min-w-[24px] text-center">
                            {key}
                          </kbd>
                          {keyIdx < item.keys.length - 1 && (
                            <span className="text-slate-400 text-xs">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">?</kbd> anywhere to show this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}