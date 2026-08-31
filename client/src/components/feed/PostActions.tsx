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
    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#3A4B4D] text-[#A8AAA0]">
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Like Button */}
        <button
          type="button"
          onClick={onToggleLike}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all group active:scale-95',
            isLiked
              ? 'text-[#B87568] bg-[#B87568]/15'
              : 'hover:bg-[#2B3940] hover:text-[#B87568]'
          )}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-transform group-hover:scale-110',
              isLiked && 'fill-[#B87568] animate-heart-burst'
            )}
          />
          <span>{likesCount}</span>
        </button>

        {/* Comment Button */}
        <button
          type="button"
          onClick={onToggleComments}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all group',
            commentsOpen
              ? 'text-[#D9D0B8] bg-[#496D6B]'
              : 'hover:bg-[#2B3940] hover:text-[#D9D0B8]'
          )}
        >
          <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span>{commentsCount}</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-semibold hover:bg-[#2B3940] hover:text-[#D9D0B8] transition-all"
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
          'p-2 rounded-[10px] hover:bg-[#2B3940] transition-colors',
          bookmarked ? 'text-[#D0A56A]' : 'text-[#7F8B86] hover:text-[#D9D0B8]'
        )}
        title={bookmarked ? 'Saved' : 'Save post'}
      >
        <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-[#D0A56A]')} />
      </button>
    </div>

  );
};
