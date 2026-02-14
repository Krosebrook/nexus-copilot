import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from 'lucide-react';

const SHORTCUTS = [
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['⌘', '/'], description: 'Open Copilot' },
      { keys: ['⌘', '\\'], description: 'Toggle sidebar' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ]
  },
  {
    category: 'Actions',
    shortcuts: [
      { keys: ['⌘', 'N'], description: 'New item (context-aware)' },
      { keys: ['⌘', 'S'], description: 'Save changes' },
      { keys: ['⌘', 'Enter'], description: 'Submit/Confirm' },
      { keys: ['Esc'], description: 'Close dialog/Cancel' },
    ]
  },
  {
    category: 'Selection & Navigation',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navigate items' },
      { keys: ['Enter'], description: 'Open/Select item' },
      { keys: ['⌘', 'A'], description: 'Select all' },
      { keys: ['/'], description: 'Focus search' },
    ]
  }
];

export default function KeyboardShortcutsDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-slate-600" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Navigate faster with keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {SHORTCUTS.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-600">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <Badge
                          key={keyIdx}
                          variant="outline"
                          className="font-mono text-xs px-2 py-1 bg-slate-50"
                        >
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-600">
            💡 <strong>Tip:</strong> Most shortcuts work across the entire app. 
            Context-specific shortcuts appear in the interface where applicable.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}