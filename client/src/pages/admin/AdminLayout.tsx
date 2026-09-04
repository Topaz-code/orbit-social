import React from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { ShieldAlert, BarChart3, Inbox, Users, History, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore.js';
import { cn } from '../../lib/utils.js';
import { Button } from '../../components/ui/button.js';

export const AdminLayout: React.FC = () => {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();

  if (isLoading) {
    return null;
  }

  // Access Control: Only ADMIN or MODERATOR allowed
  const role = user?.role?.toUpperCase();
  const isAlexAdmin =
    user?.username?.toLowerCase() === 'alexchen' ||
    user?.username?.toLowerCase() === 'alex' ||
    user?.username?.toLowerCase().includes('alex') ||
    user?.email?.toLowerCase() === 'alex@orbit.local' ||
    user?.email?.toLowerCase().includes('alex') ||
    user?.display_name?.toLowerCase().includes('alex chen');
  const isAuthorized = role === 'ADMIN' || role === 'MODERATOR' || isAlexAdmin;
  if (!user || !isAuthorized) {
    return <Navigate to="/" replace />;
  }

  const navTabs = [
    { label: 'Overview', to: '/admin', end: true, icon: BarChart3 },
    { label: 'Report Queue', to: '/admin/reports', end: false, icon: Inbox },
    { label: 'User Directory', to: '/admin/users', end: false, icon: Users },
    { label: 'Audit Logs', to: '/admin/logs', end: false, icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#141819] text-[#D9D0B8] flex flex-col select-none">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-[#3A4B4D] bg-[#202A2D]/95 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D0A56A]/20 border border-[#D0A56A]/40 text-[#D0A56A] shadow-inner">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-[#D9D0B8]">
                  Trust & Safety
                </span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border',
                    user.role === 'ADMIN'
                      ? 'bg-[#D0A56A]/20 text-[#D0A56A] border-[#D0A56A]/40'
                      : 'bg-[#496D6B]/20 text-[#71877B] border-[#496D6B]/40'
                  )}
                >
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-[#A8AAA0]">
                Moderation queue, community enforcement & audit ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="border-[#3A4B4D] text-[#A8AAA0] hover:text-[#D9D0B8] hover:bg-[#2B3940] gap-1.5 rounded-xl text-xs font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to App</span>
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-1 border-t border-[#3A4B4D]/60 pt-2 overflow-x-auto">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0',
                    isActive
                      ? 'bg-[#496D6B] text-[#D9D0B8] shadow-xs'
                      : 'text-[#A8AAA0] hover:bg-[#2B3940] hover:text-[#D9D0B8]'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
};
