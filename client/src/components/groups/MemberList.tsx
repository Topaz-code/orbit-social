import React from 'react';
import { NavLink } from 'react-router-dom';
import { GroupMember } from '../../types/index.js';
import { Avatar } from '../ui/avatar.js';
import { Badge } from '../ui/badge.js';
import { Crown, Shield, User, UserMinus } from 'lucide-react';

interface MemberListProps {
  members: GroupMember[];
  isAdmin?: boolean;
  onRemoveMember?: (userId: string) => void;
  currentUserId?: string;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  isAdmin,
  onRemoveMember,
  currentUserId,
}) => {
  return (
    <div className="divide-y divide-[#3A4B4D] rounded-2xl border border-[#3A4B4D] bg-[#202A2D] p-2 text-[#D9D0B8]">
      {members.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between p-3 hover:bg-[#2B3940] rounded-xl transition-colors"
        >
          <NavLink
            to={`/profile/${m.user.id}`}
            className="flex items-center gap-3 group min-w-0"
          >
            <Avatar
              src={m.user.avatar_url}
              fallback={m.user.display_name}
              isOnline={m.user.is_online}
              showStatus
              size="md"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#D9D0B8] group-hover:text-[#D0A56A] transition-colors truncate">
                  {m.user.display_name}
                </span>
                {m.role === 'admin' ? (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 flex items-center gap-1 bg-[#D0A56A] text-[#171A1C]">
                    <Crown className="h-2.5 w-2.5" /> Admin
                  </Badge>
                ) : m.role === 'moderator' ? (
                  <Badge variant="cyan" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                    <Shield className="h-2.5 w-2.5" /> Mod
                  </Badge>
                ) : null}
              </div>
              <p className="text-[11px] text-[#A8AAA0] truncate">@{m.user.username}</p>
            </div>
          </NavLink>

          {isAdmin && onRemoveMember && m.role !== 'admin' && m.user_id !== currentUserId && (
            <button
              type="button"
              onClick={() => onRemoveMember(m.user_id)}
              className="p-1.5 text-[#7F8B86] hover:text-[#B87568] rounded-[8px] hover:bg-[#2B3940] transition-colors"
              title="Remove from group"
            >
              <UserMinus className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );

};
