'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import {
  Menu,
  X,
  Bell,
  ChevronDown,
  LogOut,
  Sparkles,
  Building,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface RoleLayoutProps {
  role: UserRole;
  roleTitle: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

export default function RoleLayout({
  role,
  roleTitle,
  navItems,
  children,
}: RoleLayoutProps) {
  const pathname = usePathname();
  const { user, logout, switchRole } = useAuth();
  const { college, setCollege, apiConnected } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = [
    { id: 1, title: 'Adaptive test recorded', time: '10m ago', unread: true },
    { id: 2, title: 'Drive schedule clash detected', time: '1h ago', unread: true },
    { id: 3, title: 'Cryptographic hash block confirmed', time: '2h ago', unread: false },
  ];

  return (
    <div className="min-h-screen bg-bg text-ink flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-pri focus:text-white focus:text-xs focus:font-bold"
      >
        Skip to main content
      </a>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-64 bg-side text-[#94a3b8] flex flex-col z-50 transition-transform duration-200 ease-in-out border-r border-[#1e293b] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#1e293b]">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-lg text-white">
            <span className="w-8 h-8 rounded-lg bg-pri text-white flex items-center justify-center font-bold text-sm shadow-sm">
              P
            </span>
            <span className="tracking-tight">ProofHire 2.0</span>
          </Link>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-[#94a3b8] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Role Identity Tag */}
        <div className="px-5 py-3 border-b border-[#1e293b]/60 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-pri">
            {roleTitle}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1e293b] text-[#cbd5e1]">
            Tenant {college}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-colors ${
                  isActive
                    ? 'bg-pri text-white font-bold shadow-sm'
                    : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-white'
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="truncate">{item.title}</span>
                {item.badge && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#1e293b] text-[#cbd5e1]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Tenant Switcher Footer */}
        <div className="p-4 border-t border-[#1e293b]">
          <div className="text-[11px] text-[#64748b] font-semibold mb-2">College Campus Tenant</div>
          <div className="grid grid-cols-2 gap-1.5 bg-[#050b14] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setCollege('A')}
              className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all ${
                college === 'A' ? 'bg-[#1e293b] text-white shadow-xs' : 'text-[#64748b] hover:text-white'
              }`}
            >
              College A
            </button>
            <button
              type="button"
              onClick={() => setCollege('B')}
              className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all ${
                college === 'B' ? 'bg-[#1e293b] text-white shadow-xs' : 'text-[#64748b] hover:text-white'
              }`}
            >
              College B
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-card border-b border-line flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-mut hover:text-ink hover:bg-bg transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-mut">
              <span>Tenant:</span>
              <span className="text-ink font-bold">Apex Institute ({college})</span>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-3">
            {/* Live API Health Indicator */}
            {apiConnected ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-okt text-ok border border-ok/20">
                <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
                Live API
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pt text-pri border border-pri/20">
                <span className="w-2 h-2 rounded-full bg-pri" />
                Standalone
              </span>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                aria-label="Toggle notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl text-mut hover:text-ink hover:bg-bg transition-colors"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-bad" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-card border border-line rounded-2xl shadow-xl p-3 z-50 animate-scaleUp">
                  <div className="flex justify-between items-center px-2 py-1.5 border-b border-line mb-2">
                    <span className="font-bold text-xs text-ink">Notifications</span>
                    <span className="text-[10px] text-pri font-bold">2 unread</span>
                  </div>
                  <div className="space-y-1">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2 rounded-xl text-xs transition-colors ${
                          n.unread ? 'bg-bg text-ink font-semibold' : 'text-mut'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="truncate">{n.title}</span>
                          <span className="text-[10px] text-mut font-normal">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-bg border border-line hover:border-pri/40 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-pri text-white font-bold text-xs flex items-center justify-center">
                  {user?.name?.[0] || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-ink leading-none">{user?.name || 'User'}</div>
                  <div className="text-[10px] text-mut capitalize mt-0.5">{role}</div>
                </div>
                <ChevronDown size={14} className="text-mut hidden sm:block" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card border border-line rounded-2xl shadow-xl p-2 z-50 animate-scaleUp">
                  <div className="px-3 py-2 border-b border-line mb-1">
                    <div className="text-xs font-bold text-ink">{user?.name}</div>
                    <div className="text-[11px] text-mut truncate">{user?.email}</div>
                  </div>

                  {/* Switch Role Quick Shortcuts */}
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-mut">
                      Switch Role (Demo)
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        switchRole('student');
                        setProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-bg flex items-center gap-2"
                    >
                      <Sparkles size={13} className="text-pri" /> Student
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchRole('officer');
                        setProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-bg flex items-center gap-2"
                    >
                      <ShieldCheck size={13} className="text-ok" /> T&P Officer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchRole('recruiter');
                        setProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-bg flex items-center gap-2"
                    >
                      <UserCheck size={13} className="text-warn" /> Recruiter
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchRole('university');
                        setProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-ink hover:bg-bg flex items-center gap-2"
                    >
                      <Building size={13} className="text-blu" /> University Admin
                    </button>
                  </div>

                  <div className="border-t border-line mt-1 pt-1">
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-bad hover:bg-bt flex items-center gap-2"
                    >
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main id="main-content" className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
