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
    { label: 'Calls', to: '/calls', iconName: 'phone' },
    {
      label: 'Alerts',
      to: '/notifications',
      iconName: 'bell',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { label: 'Profile', to: user ? `/profile/${user.id}` : '/profile', iconName: 'user' },
  ];

  return (
    <nav className="sticky top-16 z-20 flex lg:hidden h-14 w-full items-center border-b border-[#3A4B4D] bg-[#141819] select-none">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            cn(
              'relative flex flex-1 h-full flex-col items-center justify-center py-2 transition-colors',
              isActive
                ? 'text-[#D9D0B8] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:bg-[#496D6B] after:rounded-full'
                : 'text-[#7F8B86] hover:text-[#A8AAA0]'
            )
          }
        >
          <div className="relative flex items-center justify-center">
            <AnimatedIcon name={item.iconName} size={22} />
            {item.badge !== undefined && (
              <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B87568] px-1 text-[10px] font-bold text-white shadow-sm">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </div>
        </NavLink>
      ))}
    </nav>
  );
};




