import React from 'react';
import { NavLink } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useNotificationStore } from '../../stores/notificationStore.js';
import { Avatar } from '../ui/avatar.js';
import { AnimatedIcon, AnimatedIconName } from '../ui/AnimatedIcon.js';

interface SidebarProps {
  onOpenNewPost?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenNewPost }) => {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const navItems: Array<{
    label: string;
    to: string;
    iconName: AnimatedIconName;
    badge?: number;
  }> = [
    { label: 'Feed', to: '/', iconName: 'home' },
    { label: 'Explore', to: '/explore', iconName: 'compass' },
    { label: 'Messages', to: '/messages', iconName: 'chat' },
    { label: 'Groups', to: '/groups', iconName: 'users' },
    { label: 'Stories', to: '/stories', iconName: 'flame' },
    {
      label: 'Notifications',
      to: '/notifications',
      iconName: 'bell',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { label: 'Calls', to: '/calls', iconName: 'phone' },
    { label: 'Profile', to: user ? `/profile/${user.id}` : '/profile', iconName: 'user' },
    { label: 'Settings', to: '/settings', iconName: 'settings' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 select-none z-30">
      {/* Brand Logo */}
      <NavLink to="/" className="flex items-center gap-3 px-3 py-3 mb-4 group">
        <img
          src="/orbit-logo.svg"
          alt="Orbit"
          className="h-9 w-9 transition-transform duration-300 group-hover:rotate-12"
        />
        <div>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Orbit
          </span>
          <p className="text-[10px] font-medium text-slate-400 -mt-1 tracking-wider uppercase">
            Privacy First
          </p>
        </div>
      </NavLink>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm shadow-indigo-500/5'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
              )
            }
          >
            <div className="flex items-center gap-3.5">
              <AnimatedIcon name={item.iconName} size={20} />
              <span>{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white shadow-sm shadow-rose-500/30">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Quick Post Action Button */}
      {onOpenNewPost && (
        <button
          onClick={onOpenNewPost}
          className="my-3 flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/25 active:scale-[0.98] transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Post</span>
        </button>
      )}

      {/* Current User Card */}
      {user && (
        <NavLink
          to={`/profile/${user.id}`}
          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mt-auto border border-slate-100 dark:border-slate-800/60"
        >
          <Avatar
            src={user.avatar_url}
            fallback={user.display_name}
            isOnline={true}
            showStatus={true}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {user.display_name}
            </p>
            <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
          </div>
        </NavLink>
      )}
    </aside>
  );
};
