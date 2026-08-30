import React from 'react';
import { Notification } from '../../types/index.js';
import { formatRelativeTime } from '../../lib/utils.js';
import {
  Heart,
  MessageCircle,
  UserPlus,
  PhoneMissed,
  Users,
  Flame,
  Check,
  Bell,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  onDelete,
}) => {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (notification.type) {
      case 'post_like':
        return <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />;
      case 'post_comment':
      case 'new_message':
        return <MessageCircle className="h-4 w-4 text-indigo-500" />;
      case 'friend_request':
      case 'friend_accept':
        return <UserPlus className="h-4 w-4 text-emerald-500" />;
      case 'missed_call':
        return <PhoneMissed className="h-4 w-4 text-rose-500" />;
      case 'group_invite':
      case 'group_post':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'story_reply':
        return <Flame className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkRead(notification.id);
    }

    if (notification.reference_type === 'post') {
      navigate(`/posts/${notification.reference_id}`);
    } else if (notification.reference_type === 'conversation') {
      navigate('/messages');
    } else if (notification.reference_type === 'user' || notification.type === 'friend_request') {
      navigate(`/profile/${notification.reference_id}`);
    } else if (notification.reference_type === 'group') {
      navigate(`/groups/${notification.reference_id}`);
    } else if (notification.type === 'missed_call') {
      navigate('/calls');
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start justify-between gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
        notification.is_read
          ? 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
          : 'border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 font-medium'
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 shadow-inner">
          {getIcon()}
        </div>

        <div className="min-w-0">
          <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug break-words">
            {notification.content}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {!notification.is_read && (
          <button
            type="button"
            onClick={() => onMarkRead(notification.id)}
            className="p-1 rounded-md text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
            title="Mark as read"
          >
            <Check className="h-4 w-4" />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(notification.id)}
            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Delete notification"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
