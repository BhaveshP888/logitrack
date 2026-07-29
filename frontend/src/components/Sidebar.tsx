import React from 'react';
import { useAppDispatch } from '../store/hooks.js';
import { logoutUser } from '../store/authSlice.js';
import { API_BASE } from '../config.js';

export type ViewMode = 'dashboard' | 'analytics' | 'fleet' | 'tracking';

interface SidebarProps {
  activeView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ activeView, onNavigate, isCollapsed, onToggle }: SidebarProps) {
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (_) { /* proceed anyway */ }
    dispatch(logoutUser());
  };

  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Command Center',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1.5" /><rect width="7" height="5" x="14" y="3" rx="1.5" /><rect width="7" height="9" x="14" y="12" rx="1.5" /><rect width="7" height="5" x="3" y="16" rx="1.5" /></svg>
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
    },
    {
      id: 'tracking',
      label: 'Tracking',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
    },
    {
      id: 'fleet',
      label: 'Fleet',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    }
  ];

  return (
    <aside
      className={`bg-bg-sidebar backdrop-blur-2xl border-r border-white/[0.04] flex flex-col py-6 z-20 gap-6 transition-all duration-200 ease-in-out shrink-0 ${
        isCollapsed ? 'w-[60px] px-2' : 'w-[200px] px-4'
      }`}
    >
      {/* Logo + Toggle */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-1`}>
        <div className={`font-display font-bold text-zinc-100 flex items-center gap-2.5 ${isCollapsed ? '' : ''}`}>
          <div className="w-7 h-7 bg-brand-primary rounded-lg flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111113" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          </div>
          {!isCollapsed && <span className="text-lg">LogiTrack</span>}
        </div>
        {!isCollapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors cursor-pointer"
            aria-label="Collapse sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/></svg>
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <button
          onClick={onToggle}
          className="mx-auto p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors cursor-pointer"
          aria-label="Expand sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/></svg>
        </button>
      )}
      
      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {navItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center ${isCollapsed ? 'justify-center' : ''} gap-3 ${isCollapsed ? 'px-0 py-2.5' : 'px-3 py-2.5'} rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                isActive 
                  ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <span className={`shrink-0 ${isActive ? 'text-brand-primary' : 'text-zinc-600'}`}>{item.icon}</span>
              {!isCollapsed && item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom: Logout */}
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Sign Out' : undefined}
          className={`flex items-center ${isCollapsed ? 'justify-center' : ''} gap-3 ${isCollapsed ? 'px-0 py-2.5' : 'px-3 py-2.5'} rounded-xl text-[13px] font-medium text-zinc-500 hover:text-status-danger hover:bg-status-danger/5 border border-transparent hover:border-status-danger/10 transition-all duration-150 cursor-pointer`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          {!isCollapsed && 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
