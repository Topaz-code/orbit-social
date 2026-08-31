import React from 'react';
import { useNotifications } from '../hooks/useNotifications.js';
import { NotificationItem } from '../components/notifications/NotificationItem.js';
import { Button } from '../components/ui/button.js';
import { EmptyState } from '../components/shared/EmptyState.js';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Notification } from '../types/index.js';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markSingleRead,
    markAllRead,
    deleteSingleNotification,
    clearAllNotifications,
  } = useNotifications();

  return (
    <div className="max-w-2xl mx-auto min-w-0 pb-16 text-[#D9D0B8]">
      <div className="flex items-center justify-between p-4 mb-6 rounded-2xl bg-[#202A2D] border border-[#3A4B4D] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2B3940] border border-[#3A4B4D] text-[#D0A56A]">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#D9D0B8]">Notifications</h1>
            <p className="text-xs text-[#A8AAA0]">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'You are all caught up!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-[#71877B] hover:text-[#D9D0B8] hover:bg-[#2B3940]">
              <CheckCheck className="h-4 w-4 mr-1 text-[#71877B]" />
              <span>Mark all read</span>
            </Button>
          )}

          {notifications.length > 0 && (
            <Button variant="ghost" size="icon-sm" onClick={clearAllNotifications} title="Clear all" className="text-[#7F8B86] hover:text-[#B87568] hover:bg-[#2B3940]">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="When friends interact with your posts or message you, notifications will show up here."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n: Notification) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={markSingleRead}
              onDelete={deleteSingleNotification}
            />
          ))}
        </div>
      )}
    </div>
  );

};
