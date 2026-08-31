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
        return <Heart className="h-4 w-4 text-[#B87568] fill-[#B87568]" />;
      case 'post_comment':
      case 'new_message':
        return <MessageCircle className="h-4 w-4 text-[#496D6B]" />;
      case 'friend_request':
      case 'friend_accept':
        return <UserPlus className="h-4 w-4 text-[#71877B]" />;
      case 'missed_call':
        return <PhoneMissed className="h-4 w-4 text-[#B87568]" />;
      case 'group_invite':
      case 'group_post':
        return <Users className="h-4 w-4 text-[#496D6B]" />;
      case 'story_reply':
        return <Flame className="h-4 w-4 text-[#D0A56A]" />;
      default:
        return <Bell className="h-4 w-4 text-[#7F8B86]" />;
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
          ? 'border-[#3A4B4D] bg-[#202A2D] hover:bg-[#2B3940]'
          : 'border-[#496D6B]/50 bg-[#496D6B]/15 hover:bg-[#496D6B]/25 font-medium'
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2B3940] border border-[#3A4B4D] flex-shrink-0 shadow-xs">
          {getIcon()}
        </div>

        <div className="min-w-0">
          <p className="text-xs text-[#D9D0B8] leading-snug break-words">
            {notification.content}
          </p>
          <span className="text-[10px] text-[#A8AAA0] mt-1 block">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {!notification.is_read && (
          <button
            type="button"
            onClick={() => onMarkRead(notification.id)}
            className="p-1 rounded-[6px] text-[#D0A56A] hover:bg-[#2B3940]"
            title="Mark as read"
          >
            <Check className="h-4 w-4" />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(notification.id)}
            className="p-1 rounded-[6px] text-[#7F8B86] hover:text-[#B87568] hover:bg-[#2B3940]"
            title="Delete notification"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

