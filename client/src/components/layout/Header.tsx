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
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#3A4B4D] bg-[#141819] px-4 sm:px-8">
      {/* Mobile Logo Brand */}
      <div className="flex items-center gap-3 lg:hidden">
        <img src="/orbit-logo.svg" alt="Orbit" className="h-8 w-8 cursor-pointer" onClick={() => navigate('/')} />
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-4 sm:mx-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7F8B86]" />
          <input
            type="text"
            placeholder="Search people, posts, or groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 rounded-[10px] border border-[#3A4B4D] bg-[#2B3940] pl-10 pr-4 text-sm text-[#D9D0B8] placeholder:text-[#7F8B86] focus:outline-none focus:ring-2 focus:ring-[#496D6B] transition-all"
          />
        </div>
      </form>

      {/* Right Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action Buttons */}
        {onOpenNewStory && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenNewStory}
            className="hidden sm:inline-flex bg-[#496D6B] text-[#D9D0B8] hover:bg-[#5A7D78]"
          >
            <Flame className="h-4 w-4 mr-1.5 text-[#D0A56A]" />
            <span>Story</span>
          </Button>
        )}

        {onOpenNewPost && (
          <Button
            size="sm"
            onClick={onOpenNewPost}
            className="hidden sm:inline-flex bg-[#D0A56A] text-[#171A1C] hover:bg-[#E0B779] font-semibold"
          >
            <Plus className="h-4 w-4 mr-1 stroke-[2.5]" />
            <span>Post</span>
          </Button>
        )}

        {/* Notifications Dropdown */}
        <DropdownMenu
          trigger={
            <button className="relative flex h-10 w-10 items-center justify-center rounded-[10px] hover:bg-[#2B3940] text-[#D9D0B8] transition-colors">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5 rounded-full bg-[#D0A56A] ring-2 ring-[#141819]" />
              )}
            </button>
          }
        >
          <div className="p-3 border-b border-[#3A4B4D] flex items-center justify-between">
            <span className="text-xs font-bold text-[#D9D0B8] uppercase tracking-wider">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-[#D0A56A] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto py-1">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#7F8B86]">
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
                  <p className={cn('text-[#D9D0B8]', !n.is_read && 'font-semibold text-[#D0A56A]')}>
                    {n.content}
                  </p>
                  <span className="text-[10px] text-[#A8AAA0]">
                    {formatRelativeTime(n.created_at)}
                  </span>
                </DropdownItem>
              ))
            )}
          </div>

          <DropdownDivider />
          <DropdownItem onClick={() => navigate('/notifications')} className="text-center justify-center text-xs font-semibold text-[#D0A56A]">
            View all notifications
          </DropdownItem>
        </DropdownMenu>


        {/* User Profile Avatar Dropdown */}
        {user && (
          <DropdownMenu
            trigger={
              <button className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#496D6B] transition-all">
                <Avatar
                  src={user.avatar_url}
                  fallback={user.display_name}
                  size="sm"
                  isOnline={true}
                />
              </button>
            }
          >
            <div className="p-3 border-b border-[#3A4B4D]">
              <p className="text-sm font-bold text-[#D9D0B8] truncate">
                {user.display_name}
              </p>
              <p className="text-xs text-[#A8AAA0] truncate">@{user.username}</p>
            </div>

            <DropdownItem onClick={() => navigate(`/profile/${user.id}`)}>
              <UserIcon className="h-4 w-4 text-[#7F8B86]" />
              <span>Your Profile</span>
            </DropdownItem>

            <DropdownItem onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 text-[#7F8B86]" />
              <span>Settings & Privacy</span>
            </DropdownItem>

            <DropdownDivider />

            {/* Theme Toggle Submenu */}
            <div className="px-3 py-1 text-[11px] font-semibold text-[#7F8B86] uppercase tracking-wider">
              Theme
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#2B3940] rounded-lg mx-2 mb-2 border border-[#3A4B4D]">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={cn(
                  'flex items-center justify-center p-1.5 rounded-md text-xs transition-colors',
                  theme === 'light' ? 'bg-[#202A2D] text-[#D0A56A] font-bold shadow-xs' : 'text-[#7F8B86] hover:text-[#D9D0B8]'
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
                  theme === 'dark' ? 'bg-[#202A2D] text-[#D0A56A] font-bold shadow-xs' : 'text-[#7F8B86] hover:text-[#D9D0B8]'
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
                  theme === 'system' ? 'bg-[#202A2D] text-[#D0A56A] font-bold shadow-xs' : 'text-[#7F8B86] hover:text-[#D9D0B8]'
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
