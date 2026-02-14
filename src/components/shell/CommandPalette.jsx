import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { 
  Home, MessageSquare, Book, Activity, Settings, 
  Plus, Search, LogOut, User, Workflow, BarChart3,
  CheckCircle, Sparkles, FileText
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const NAVIGATION_ITEMS = [
  { label: 'Dashboard', icon: Home, href: 'Dashboard', keywords: ['home', 'overview'] },
  { label: 'Copilot', icon: MessageSquare, href: 'Copilot', keywords: ['ai', 'assistant', 'chat'] },
  { label: 'Knowledge Base', icon: Book, href: 'Knowledge', keywords: ['docs', 'articles', 'documentation'] },
  { label: 'Workflows', icon: Activity, href: 'WorkflowBuilder', keywords: ['automation', 'flows'] },
  { label: 'Agents', icon: Sparkles, href: 'AgentBuilder', keywords: ['ai agents', 'bots'] },
  { label: 'Analytics', icon: BarChart3, href: 'Analytics', keywords: ['reports', 'metrics', 'insights'] },
  { label: 'Approvals', icon: CheckCircle, href: 'Approvals', keywords: ['pending', 'review'] },
  { label: 'Activity Log', icon: FileText, href: 'ActivityLog', keywords: ['audit', 'history', 'events'] },
  { label: 'Settings', icon: Settings, href: 'Settings', keywords: ['config', 'preferences'] },
];

const ACTIONS = [
  { label: 'New Workflow', action: 'create_workflow', icon: Plus, keywords: ['create', 'add'] },
  { label: 'New Agent', action: 'create_agent', icon: Plus, keywords: ['create', 'add'] },
  { label: 'New Knowledge Article', action: 'create_article', icon: Plus, keywords: ['create', 'add', 'document'] },
  { label: 'Ask Copilot', action: 'open_copilot', icon: MessageSquare, keywords: ['question', 'help'] },
  { label: 'Sign Out', action: 'logout', icon: LogOut, keywords: ['exit', 'quit'] },
];

export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    setPages([...NAVIGATION_ITEMS]);
  }, []);

  const runCommand = (callback) => {
    onOpenChange(false);
    callback();
  };

  const handleAction = (action) => {
    switch (action) {
      case 'create_workflow':
        navigate(createPageUrl('WorkflowBuilder'));
        break;
      case 'create_agent':
        navigate(createPageUrl('AgentBuilder'));
        break;
      case 'create_article':
        navigate(createPageUrl('Knowledge'));
        break;
      case 'open_copilot':
        navigate(createPageUrl('Copilot'));
        break;
      case 'logout':
        base44.auth.logout();
        break;
      default:
        break;
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          {pages.map((page) => {
            const Icon = page.icon;
            return (
              <CommandItem
                key={page.href}
                onSelect={() => runCommand(() => navigate(createPageUrl(page.href)))}
                keywords={page.keywords}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{page.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <CommandItem
                key={action.action}
                onSelect={() => runCommand(() => handleAction(action.action))}
                keywords={action.keywords}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{action.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}