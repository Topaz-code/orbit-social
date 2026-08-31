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
    <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#3A4B4D] bg-[#202A2D] shadow-xs hover:border-[#496D6B]/50 transition-all text-[#D9D0B8]">
      <NavLink to={`/profile/${friend.id}`} className="flex items-center gap-3 min-w-0 group">
        <Avatar
          src={friend.avatar_url}
          fallback={friend.display_name}
          isOnline={friend.is_online}
          showStatus
          size="md"
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#D9D0B8] group-hover:text-[#D0A56A] transition-colors truncate">
            {friend.display_name}
          </p>
          <p className="text-xs text-[#A8AAA0] truncate">@{friend.username}</p>
          {friend.bio && (
            <p className="text-[11px] text-[#A8AAA0] truncate mt-0.5 max-w-[180px] sm:max-w-xs">
              {friend.bio}
            </p>
          )}
        </div>
      </NavLink>

      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
        <Button variant="ghost" size="icon-sm" onClick={handleMessage} title="Message" className="text-[#496D6B] hover:bg-[#2B3940]">
          <MessageCircle className="h-4 w-4" />
        </Button>

        {isSelf && onRemoveFriend && friend.friendship_id && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemoveFriend(friend.friendship_id!)}
            className="text-[#7F8B86] hover:text-[#B87568] hover:bg-[#2B3940]"
            title="Remove friend"
          >
            <UserX className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

};
