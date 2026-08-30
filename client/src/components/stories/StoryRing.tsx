import React from 'react';
import { cn } from '../../lib/utils.js';
import { Avatar } from '../ui/avatar.js';

interface StoryRingProps {
  avatarUrl?: string;
  displayName: string;
  hasUnseenStory?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export const StoryRing: React.FC<StoryRingProps> = ({
  avatarUrl,
  displayName,
  hasUnseenStory = true,
  size = 'md',
  onClick,
  className,
}) => {
  const containerSizes = {
    sm: 'p-[2px]',
    md: 'p-[2.5px]',
    lg: 'p-[3.5px]',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative inline-flex rounded-full cursor-pointer transition-transform hover:scale-105 active:scale-95 select-none',
        hasUnseenStory
          ? 'story-ring-gradient shadow-md shadow-purple-500/20'
          : 'bg-slate-200 dark:bg-slate-700',
        containerSizes[size],
        className
      )}
    >
      <div className="rounded-full bg-white dark:bg-slate-900 p-[2px]">
        <Avatar
          src={avatarUrl}
          fallback={displayName}
          size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'}
        />
      </div>
    </div>
  );
};
