import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useNotificationStore } from '../../stores/notificationStore.js';
import { AnimatedIcon, AnimatedIconName } from '../ui/AnimatedIcon.js';

export const MobileNav: React.FC = () => {
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
    {
      label: 'Alerts',
      to: '/notifications',
      iconName: 'bell',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { label: 'Profile', to: user ? `/profile/${user.id}` : '/profile', iconName: 'user' },
  ];

  return (
    <nav className="sticky top-16 z-20 flex lg:hidden h-13 items-center justify-around border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-1 shadow-xs">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl text-[11px] font-medium transition-all',
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/50'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            )
          }
        >
          <AnimatedIcon name={item.iconName} size={18} className="mb-0.5" />
          <span>{item.label}</span>
          {item.badge !== undefined && (
            <span className="absolute -top-0.5 right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm">
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

