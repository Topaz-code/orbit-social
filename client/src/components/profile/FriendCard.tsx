import React from 'react';
import { NavLink } from 'react-router-dom';
import { Avatar } from '../ui/avatar.js';
import { Button } from '../ui/button.js';
import { MessageCircle, UserX } from 'lucide-react';
import { useChat } from '../../hooks/useChat.js';
import { useNavigate } from 'react-router-dom';

interface FriendCardProps {
  friend: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    bio?: string;
    is_online?: boolean;
    friendship_id?: string | null;
  };
  isSelf?: boolean;
  onRemoveFriend?: (friendshipId: string) => void;
}

export const FriendCard: React.FC<FriendCardProps> = ({
  friend,
  isSelf,
  onRemoveFriend,
}) => {
  const navigate = useNavigate();
  const { startConversation } = useChat();

  const handleMessage = async () => {
    const conv = await startConversation(friend.id);
    if (conv) navigate('/messages');
  };

  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <NavLink to={`/profile/${friend.id}`} className="flex items-center gap-3 min-w-0 group">
        <Avatar
          src={friend.avatar_url}
          fallback={friend.display_name}
          isOnline={friend.is_online}
          showStatus
          size="md"
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors truncate">
            {friend.display_name}
          </p>
          <p className="text-xs text-slate-400 truncate">@{friend.username}</p>
          {friend.bio && (
            <p className="text-[11px] text-slate-500 truncate mt-0.5 max-w-[180px] sm:max-w-xs">
              {friend.bio}
            </p>
          )}
        </div>
      </NavLink>

      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
        <Button variant="ghost" size="icon-sm" onClick={handleMessage} title="Message">
          <MessageCircle className="h-4 w-4 text-indigo-500" />
        </Button>

        {isSelf && onRemoveFriend && friend.friendship_id && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemoveFriend(friend.friendship_id!)}
            className="hover:text-rose-500"
            title="Remove friend"
          >
            <UserX className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
