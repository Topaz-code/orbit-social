import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Flame,
  Bell,
  Sun,
  Moon,
  Laptop,
  LogOut,
  User as UserIcon,
  Settings,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore.js';
import { useNotificationStore } from '../../stores/notificationStore.js';
import { useThemeStore } from '../../stores/themeStore.js';
import { Avatar } from '../ui/avatar.js';
import { Button } from '../ui/button.js';
import { DropdownMenu, DropdownItem, DropdownDivider } from '../ui/dropdown-menu.js';
import { formatRelativeTime, cn } from '../../lib/utils.js';

interface HeaderProps {
  onOpenNewPost?: () => void;
  onOpenNewStory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewPost, onOpenNewStory }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const { theme, setTheme } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 sm:px-6">
      {/* Mobile Logo Brand */}
      <div className="flex items-center gap-3 lg:hidden">
        <img src="/orbit-logo.svg" alt="Orbit" className="h-8 w-8" onClick={() => navigate('/')} />
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-2 sm:mx-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search people, posts, or groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </form>

      {/* Right Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action Buttons */}
        {onOpenNewStory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenNewStory}
            className="hidden sm:inline-flex text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <Flame className="h-4 w-4 mr-1.5 text-rose-500" />
            <span>Story</span>
          </Button>
        )}

        {onOpenNewPost && (
          <Button size="sm" onClick={onOpenNewPost} className="hidden sm:inline-flex">
            <Plus className="h-4 w-4 mr-1" />
            <span>Post</span>
          </Button>
        )}

        {/* Notifications Dropdown */}
        <DropdownMenu
          trigger={
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm shadow-rose-500/50 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          }
        >
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto py-1">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                All caught up! No notifications.
              </div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <DropdownItem
                  key={n.id}
                  onClick={() => {
                    markAsRead(n.id);
                    navigate('/notifications');
                  }}
                  className="flex flex-col items-start gap-0.5 text-xs py-2"
                >
                  <p className={cn('text-slate-800 dark:text-slate-200', !n.is_read && 'font-semibold')}>
                    {n.content}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {formatRelativeTime(n.created_at)}
                  </span>
                </DropdownItem>
              ))
            )}
          </div>

          <DropdownDivider />
          <DropdownItem onClick={() => navigate('/notifications')} className="text-center justify-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            View all notifications
          </DropdownItem>
        </DropdownMenu>

        {/* User Profile Avatar Dropdown */}
        {user && (
          <DropdownMenu
            trigger={
              <button className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/50 transition-all">
                <Avatar
                  src={user.avatar_url}
                  fallback={user.display_name}
                  size="sm"
                  isOnline={true}
                />
              </button>
            }
          >
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {user.display_name}
              </p>
              <p className="text-xs text-slate-400 truncate">@{user.username}</p>
            </div>

            <DropdownItem onClick={() => navigate(`/profile/${user.id}`)}>
              <UserIcon className="h-4 w-4 text-slate-400" />
              <span>Your Profile</span>
            </DropdownItem>

            <DropdownItem onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 text-slate-400" />
              <span>Settings & Privacy</span>
            </DropdownItem>

            <DropdownDivider />

            {/* Theme Toggle Submenu */}
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Theme
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-50 dark:bg-slate-800/60 rounded-lg mx-2 mb-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={cn(
                  'flex items-center justify-center p-1.5 rounded-md text-xs transition-colors',
                  theme === 'light' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'text-slate-500'
                )}
                title="Light"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={cn(
                  'flex items-center justify-center p-1.5 rounded-md text-xs transition-colors',
                  theme === 'dark' ? 'bg-white dark:bg-slate-700 shadow text-indigo-400' : 'text-slate-500'
                )}
                title="Dark"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={cn(
                  'flex items-center justify-center p-1.5 rounded-md text-xs transition-colors',
                  theme === 'system' ? 'bg-white dark:bg-slate-700 shadow text-indigo-500' : 'text-slate-500'
                )}
                title="System"
              >
                <Laptop className="h-3.5 w-3.5" />
              </button>
            </div>

            <DropdownDivider />

            <DropdownItem onClick={logout} destructive>
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownItem>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};
