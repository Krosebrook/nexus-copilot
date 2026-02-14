import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, Settings, Activity, 
  CheckCircle, Book, Search, LogOut, ChevronDown,
  Menu, X, Workflow
} from 'lucide-react';
import AIGlyph from '@/components/shared/AIGlyph';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import GlobalSearch from '@/components/shared/GlobalSearch';
import HelpButton from '@/components/shared/HelpButton';
import CommandPalette from '@/components/shell/CommandPalette';
import KeyboardShortcutsDialog from '@/components/shell/KeyboardShortcutsDialog';

const PRIMARY_NAV = [
  { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
  { name: 'Copilot', href: 'Copilot', icon: AIGlyph },
];

const WORKSPACE_NAV = [
  { name: 'Knowledge', href: 'Knowledge', icon: Book },
  { name: 'Workflows', href: 'WorkflowBuilder', icon: Activity },
  { name: 'Agents', href: 'AgentBuilder', icon: Workflow },
  { name: 'Analytics', href: 'Analytics', icon: Activity },
  { name: 'Activity Log', href: 'ActivityLog', icon: Activity },
  { name: 'Approvals', href: 'Approvals', icon: CheckCircle },
  { name: 'Settings', href: 'Settings', icon: Settings },
];

// Pages without layout
const STANDALONE_PAGES = ['Onboarding'];

// Check if user needs onboarding
const checkOnboarding = async () => {
  try {
    const userData = await base44.auth.me();
    const memberships = await base44.entities.Membership.filter({ 
      user_email: userData.email,
      status: 'active'
    });
    
    if (memberships.length === 0) {
      window.location.href = createPageUrl('Onboarding');
    }
  } catch (e) {
    // Not logged in
  }
};

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        const memberships = await base44.entities.Membership.filter({ 
          user_email: userData.email, 
          status: 'active' 
        });
        
        if (memberships.length === 0 && !STANDALONE_PAGES.includes(currentPageName)) {
          // User has no org, redirect to onboarding
          window.location.href = createPageUrl('Onboarding');
          return;
        }
        
        if (memberships.length > 0) {
          const orgs = await base44.entities.Organization.filter({ id: memberships[0].org_id });
          if (orgs.length > 0) setCurrentOrg(orgs[0]);
        }
      } catch (e) {
        // Not logged in
      }
    };
    fetchUser();
  }, [currentPageName]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
      // Help dialog
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
      // Copilot shortcut
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        window.location.href = createPageUrl('Copilot');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Standalone pages render without layout
  if (STANDALONE_PAGES.includes(currentPageName)) {
    return children;
  }

  // Full-screen pages (Copilot, Docs)
  const isFullScreen = ['Copilot', 'Docs'].includes(currentPageName);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 
                   user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          {/* Left: Logo & Nav */}
          <div className="flex items-center gap-6">
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
                <AIGlyph size="sm" className="text-white" />
              </div>
              <span className="font-bold text-slate-700 hidden sm:block">
                {currentOrg?.name || 'AI Copilot'}
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {PRIMARY_NAV.map((item) => {
                const isActive = currentPageName === item.href;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.href)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-slate-100 text-slate-900 shadow-sm" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                    data-tour={item.name === 'Copilot' ? 'copilot-button' : undefined}
                    >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                    </Link>
                );
              })}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      WORKSPACE_NAV.some(item => currentPageName === item.href)
                        ? "bg-slate-100 text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                    data-tour="workspace-menu"
                  >
                    <Menu className="h-4 w-4" />
                    Workspace
                    <ChevronDown className="h-3 w-3 ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {WORKSPACE_NAV.map((item) => {
                    const isActive = currentPageName === item.href;
                    return (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          to={createPageUrl(item.href)}
                          className={cn(
                            "flex items-center gap-2 cursor-pointer",
                            isActive && "bg-slate-100"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          {/* Right: Search, Help & User */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 text-slate-500 hover:text-slate-700"
              data-tour="search-button"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Search</span>
            </Button>

            <HelpButton />

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Settings')} className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav - Contextual */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white py-2 px-4">
            {/* Quick Actions for current page */}
            {currentPageName === 'Dashboard' && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 mb-2">
                  Quick Actions
                </p>
                <Link
                  to={createPageUrl('Copilot')}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                >
                  <AIGlyph size="sm" />
                  Open Copilot
                  <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-slate-100 text-slate-500 rounded">⌘/</kbd>
                </Link>
              </div>
            )}

            {currentPageName === 'Copilot' && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 mb-2">
                  Quick Actions
                </p>
                <button
                  onClick={() => {
                    setSearchOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                >
                  <Search className="h-4 w-4" />
                  Search knowledge
                  <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-slate-100 text-slate-500 rounded">⌘K</kbd>
                </button>
              </div>
            )}

            {/* Navigation */}
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 mb-2">
              Navigate
            </p>
            <nav className="space-y-1">
              {PRIMARY_NAV.map((item) => {
                const isActive = currentPageName === item.href;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.href)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-slate-100 text-slate-900" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}

              <div className="pt-2 mt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 mb-2">
                  Workspace
                </p>
                {WORKSPACE_NAV.map((item) => {
                  const isActive = currentPageName === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.href)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-slate-100 text-slate-900" 
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={cn(!isFullScreen && "")}>
        {children}
      </main>

      {/* Global Search */}
      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        recentSearches={['quarterly goals', 'team metrics', 'project status']}
      />

      {/* Command Palette */}
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
      />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
      </div>
    </ErrorBoundary>
  );
}