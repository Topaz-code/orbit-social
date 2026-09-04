import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Post } from '../../types/index.js';
import { useAuthStore } from '../../stores/authStore.js';
import { Avatar } from '../ui/avatar.js';
import { MediaGallery } from './MediaGallery.js';
import { LinkPreview } from './LinkPreview.js';
import { PostActions } from './PostActions.js';
import { CommentSection } from './CommentSection.js';
import { formatRelativeTime } from '../../lib/utils.js';
import { Globe, Users, Lock, MoreHorizontal, Trash2, Copy, Check, Flag } from 'lucide-react';
import { DropdownMenu, DropdownItem } from '../ui/dropdown-menu.js';
import { ReportDialog } from '../shared/ReportDialog.js';

interface PostCardProps {
  post: Post;
  onToggleLike: (postId: string, isLiked: boolean, event: React.MouseEvent) => void;
  onDeletePost?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onToggleLike,
  onDeletePost,
}) => {
  const { user } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const isOwner = user?.id === post.user.id;
  const isLongText = post.content_text.length > 280;
  const displayText =
    isLongText && !isExpanded
      ? `${post.content_text.slice(0, 280)}...`
      : post.content_text;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/posts/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.user.display_name} on Orbit`,
        text: post.content_text,
        url: url,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <article className="rounded-2xl border border-[#3A4B4D] bg-[#202A2D] p-4 sm:p-5 shadow-xs transition-all hover:border-[#496D6B]/50 mb-4 animate-fade-in text-[#D9D0B8]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <NavLink
          to={`/profile/${post.user.id}`}
          className="flex items-center gap-3 group"
        >
          <Avatar
            src={post.user.avatar_url}
            fallback={post.user.display_name}
            isOnline={post.user.is_online}
            showStatus={true}
            size="md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#D9D0B8] group-hover:text-[#D0A56A] transition-colors">
                {post.user.display_name}
              </span>
              <span className="text-xs text-[#A8AAA0]">@{post.user.username}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#A8AAA0]">
              <span>{formatRelativeTime(post.created_at)}</span>
              <span>•</span>
              <span className="flex items-center text-[#7F8B86]" title={`Visibility: ${post.visibility}`}>
                {post.visibility === 'public' ? (
                  <Globe className="h-3 w-3" />
                ) : post.visibility === 'friends' ? (
                  <Users className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
              </span>
            </div>
          </div>
        </NavLink>

        {/* Post Options Menu */}
        <DropdownMenu
          trigger={
            <button className="p-1.5 rounded-lg text-[#7F8B86] hover:text-[#D9D0B8] hover:bg-[#2B3940] transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
        >
          <DropdownItem onClick={handleCopyLink}>
            {copied ? <Check className="h-4 w-4 text-[#71877B]" /> : <Copy className="h-4 w-4 text-[#7F8B86]" />}
            <span>{copied ? 'Link Copied!' : 'Copy link to post'}</span>
          </DropdownItem>

          {isOwner && onDeletePost && (
            <DropdownItem onClick={() => onDeletePost(post.id)} destructive>
              <Trash2 className="h-4 w-4" />
              <span>Delete post</span>
            </DropdownItem>
          )}

          {!isOwner && (
            <DropdownItem onClick={() => setIsReportOpen(true)}>
              <Flag className="h-4 w-4 text-[#B87568]" />
              <span className="text-[#B87568]">Report post</span>
            </DropdownItem>
          )}
        </DropdownMenu>
      </div>

      {/* Content Text */}
      <div className="text-sm text-[#D9D0B8] leading-relaxed whitespace-pre-line">
        {displayText}
        {isLongText && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-1 text-[#D0A56A] font-semibold hover:underline"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>


      {/* Media Gallery */}
      <MediaGallery
        mediaUrl={post.media_url}
        mediaType={post.media_type}
        mediaGallery={post.media_gallery}
      />

      {/* Link Preview */}
      {post.link_preview && <LinkPreview preview={post.link_preview} />}

      {/* Action Bar */}
      <PostActions
        isLiked={post.is_liked}
        likesCount={post.likes_count}
        commentsCount={post.comments_count}
        onToggleLike={(e) => onToggleLike(post.id, post.is_liked, e)}
        onToggleComments={() => setShowComments(!showComments)}
        commentsOpen={showComments}
        onShare={handleShare}
      />

      {/* Threaded Comments Section */}
      {showComments && <CommentSection postId={post.id} />}

      {/* Report Post Dialog */}
      <ReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportedType="POST"
        reportedId={post.id}
        targetTitle={`Report post by @${post.user.username}`}
      />
    </article>
  );
};
