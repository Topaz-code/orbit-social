import React from 'react';
import { useNotificationStore } from '../stores/notificationStore.js';
import { NotificationItem } from '../components/notifications/NotificationItem.js';
import { Button } from '../components/ui/button.js';
import { EmptyState } from '../components/shared/EmptyState.js';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Notification } from '../types/index.js';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotificationStore();

  return (
    <div className="max-w-2xl mx-auto min-w-0">
      <div className="flex items-center justify-between p-4 mb-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">Notifications</h1>
            <p className="text-xs text-slate-400">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'You are all caught up!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-1 text-emerald-500" />
              <span>Mark all read</span>
            </Button>
          )}

          {notifications.length > 0 && (
            <Button variant="ghost" size="icon-sm" onClick={clearAll} title="Clear all">
              <Trash2 className="h-4 w-4 text-slate-400 hover:text-rose-500" />
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8 text-indigo-500" />}
          title="No notifications"
          description="When friends interact with your posts or message you, notifications will show up here."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n: Notification) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={markAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};
