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
    <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2">
      {members.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
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
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors truncate">
                  {m.user.display_name}
                </span>
                {m.role === 'admin' ? (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 flex items-center gap-1 bg-indigo-600">
                    <Crown className="h-2.5 w-2.5" /> Admin
                  </Badge>
                ) : m.role === 'moderator' ? (
                  <Badge variant="cyan" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                    <Shield className="h-2.5 w-2.5" /> Mod
                  </Badge>
                ) : null}
              </div>
              <p className="text-[11px] text-slate-400 truncate">@{m.user.username}</p>
            </div>
          </NavLink>

          {isAdmin && onRemoveMember && m.role !== 'admin' && m.user_id !== currentUserId && (
            <button
              type="button"
              onClick={() => onRemoveMember(m.user_id)}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
