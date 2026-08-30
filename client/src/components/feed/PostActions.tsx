import React from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { cn } from '../../lib/utils.js';

interface PostActionsProps {
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  onToggleLike: (e: React.MouseEvent) => void;
  onToggleComments: () => void;
  commentsOpen: boolean;
  onShare?: () => void;
}

export const PostActions: React.FC<PostActionsProps> = ({
  isLiked,
  likesCount,
  commentsCount,
  onToggleLike,
  onToggleComments,
  commentsOpen,
  onShare,
}) => {
  const [bookmarked, setBookmarked] = React.useState(false);

  return (
    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400">
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Like Button with Burst effect */}
        <button
          type="button"
          onClick={onToggleLike}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all group active:scale-95',
            isLiked
              ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-500'
          )}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-transform group-hover:scale-110',
              isLiked && 'fill-rose-500 animate-heart-burst'
            )}
          />
          <span>{likesCount}</span>
        </button>

        {/* Comment Button */}
        <button
          type="button"
          onClick={onToggleComments}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all group',
            commentsOpen
              ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600'
          )}
        >
          <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span>{commentsCount}</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Bookmark */}
      <button
        type="button"
        onClick={() => setBookmarked(!bookmarked)}
        className={cn(
          'p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
          bookmarked ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'
        )}
        title={bookmarked ? 'Saved' : 'Save post'}
      >
        <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-amber-500')} />
      </button>
    </div>
  );
};
