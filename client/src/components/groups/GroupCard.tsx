import React from 'react';
import { NavLink } from 'react-router-dom';
import { Group } from '../../types/index.js';
import { Card } from '../ui/card.js';
import { Avatar } from '../ui/avatar.js';
import { Button } from '../ui/button.js';
import { Users, Lock, Globe, ArrowRight } from 'lucide-react';
import { MAX_GROUP_MEMBERS } from '../../lib/constants.js';

interface GroupCardProps {
  group: Group;
  onJoin?: (groupId: string) => void;
  isJoining?: boolean;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onJoin,
  isJoining,
}) => {
  return (
    <Card className="overflow-hidden group hover:border-indigo-500/50 hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Cover image banner */}
        <div className="h-28 w-full overflow-hidden bg-slate-900 relative">
          <img
            src={group.cover_url}
            alt={group.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
          />
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
            {group.privacy === 'public' ? (
              <Globe className="h-3 w-3 text-emerald-400" />
            ) : (
              <Lock className="h-3 w-3 text-amber-400" />
            )}
            <span>{group.privacy}</span>
          </div>
        </div>

        {/* Info Content */}
        <div className="p-4 pt-0 relative">
          <div className="-mt-7 mb-3 flex items-end justify-between">
            <Avatar
              src={group.avatar_url}
              fallback={group.name}
              size="lg"
              className="ring-4 ring-white dark:ring-slate-900 shadow-md"
            />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {group.member_count}/{MAX_GROUP_MEMBERS} Members
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {group.name}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {group.description || 'No description provided.'}
          </p>
        </div>
      </div>

      <div className="p-4 pt-0 mt-2 flex items-center gap-2">
        <NavLink to={`/groups/${group.id}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full">
            <span>View Group</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </NavLink>

        {!group.is_member && onJoin && (
          <Button
            size="sm"
            onClick={() => onJoin(group.id)}
            isLoading={isJoining}
            disabled={group.member_count >= MAX_GROUP_MEMBERS}
          >
            Join
          </Button>
        )}
      </div>
    </Card>
  );
};
