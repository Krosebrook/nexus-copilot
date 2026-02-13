import React, { useState } from 'react';
import { HelpCircle, Mail, Book, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import KeyboardShortcutsDialog from './KeyboardShortcutsDialog';

export default function HelpButton() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setShortcutsOpen(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Keyboard Shortcuts
            <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-slate-100 rounded">?</kbd>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="https://docs.example.com" target="_blank" rel="noopener noreferrer">
              <Book className="h-4 w-4 mr-2" />
              Documentation
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Mail className="h-4 w-4 mr-2" />
            Contact Support
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <KeyboardShortcutsDialog 
        open={shortcutsOpen} 
        onOpenChange={setShortcutsOpen} 
      />
    </>
  );
}