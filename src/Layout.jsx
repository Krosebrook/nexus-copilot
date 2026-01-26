import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Sparkles, LayoutDashboard, Settings, Activity, 
  CheckCircle, Book, Search, LogOut, ChevronDown,
  Menu, X, Workflow
} from 'lucide-react';
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

const NAV_ITEMS = [
  { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
  { name: 'Copilot', href: 'Copilot', icon: Sparkles },
  { name: 'Knowledge', href: 'Knowledge', icon: Book },
  { name: 'Workflows', href: 'WorkflowBuilder', icon: Activity },
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
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          {/* Left: Logo & Nav */}
          <div className="flex items-center gap-6">
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900 hidden sm:block">
                {currentOrg?.name || 'AI Copilot'}
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = currentPageName === item.href;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.href)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
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
            </nav>
          </div>

          {/* Right: Search & User */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 text-slate-500 hover:text-slate-700"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Search</span>
              <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-slate-100 text-slate-500 rounded">
                ⌘K
              </kbd>
            </Button>

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

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white py-2 px-4">
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
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
      </div>
    </ErrorBoundary>
  );
}