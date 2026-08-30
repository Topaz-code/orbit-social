import React, { useState, useEffect, useRef } from 'react';
import { UserStoryGroup } from '../../types/index.js';
import { useStories } from '../../hooks/useStories.js';
import { useChat } from '../../hooks/useChat.js';
import { useAuthStore } from '../../stores/authStore.js';
import { Avatar } from '../ui/avatar.js';
import { getMediaUrl, formatRelativeTime } from '../../lib/utils.js';
import { X, ChevronLeft, ChevronRight, Send, Eye, Trash2 } from 'lucide-react';
import { STORY_DURATION_MS } from '../../lib/constants.js';

interface StoryViewerProps {
  storyGroups: UserStoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  storyGroups,
  initialGroupIndex,
  onClose,
}) => {
  const { user } = useAuthStore();
  const { markAsViewed, deleteStory } = useStories();
  const { startConversation, sendMessage } = useChat();

  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [replySent, setReplySent] = useState(false);

  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  // Mark active story as viewed
  useEffect(() => {
    if (currentStory && user && currentStory.user_id !== user.id) {
      markAsViewed(currentStory.id);
    }
  }, [currentStory?.id, user?.id]);

  // Auto-advance timer and progress bar
  useEffect(() => {
    if (isPaused || !currentStory) return;

    const interval = 50; // update every 50ms
    const step = (interval / STORY_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [groupIndex, storyIndex, isPaused, currentStory?.id]);

  // Reset progress when story index changes
  useEffect(() => {
    setProgress(0);
  }, [groupIndex, storyIndex]);

  const handleNext = () => {
    if (!currentGroup) return;

    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1);
      const prevGroup = storyGroups[groupIndex - 1];
      setStoryIndex(prevGroup.stories.length - 1);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentGroup || currentGroup.is_self) return;

    try {
      const conv = await startConversation(currentGroup.user.id);
      if (conv) {
        await sendMessage({
          content: `Replying to story: "${replyText.trim()}"`,
          media_url: currentStory.media_url,
          media_type: 'text',
        });
        setReplyText('');
        setReplySent(true);
        setTimeout(() => setReplySent(false), 2000);
      }
    } catch (err) {
      console.error('Failed to send story reply:', err);
    }
  };

  const handleDelete = async () => {
    if (currentStory && confirm('Are you sure you want to delete this story?')) {
      await deleteStory(currentStory.id);
      handleNext();
    }
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in select-none">
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Nav Arrow: Left */}
      <button
        type="button"
        onClick={handlePrevious}
        className="hidden md:flex absolute left-8 z-40 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <ChevronLeft className="h-8 w-8" />
      </button>

      {/* Main Story Container */}
      <div
        className="relative w-full max-w-md h-[92vh] max-h-[820px] rounded-3xl overflow-hidden bg-slate-900 shadow-2xl flex flex-col justify-between"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1.5">
          {currentGroup.stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{
                  width:
                    idx < storyIndex ? '100%' : idx === storyIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="absolute top-6 left-4 right-4 z-30 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Avatar
              src={currentGroup.user.avatar_url}
              fallback={currentGroup.user.display_name}
              size="sm"
            />
            <div>
              <p className="text-xs font-bold leading-tight">{currentGroup.user.display_name}</p>
              <p className="text-[10px] text-white/70">
                {formatRelativeTime(currentStory.created_at)}
              </p>
            </div>
          </div>

          {currentGroup.is_self && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-lg bg-black/40 text-white hover:text-rose-400"
              title="Delete story"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Media Content */}
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          {currentStory.media_type === 'video' ? (
            <video
              src={getMediaUrl(currentStory.media_url)}
              autoPlay
              playsInline
              className="h-full w-full object-contain"
            />
          ) : (
            <img
              src={getMediaUrl(currentStory.media_url)}
              alt="Story"
              className="h-full w-full object-contain"
            />
          )}

          {/* Text Overlay */}
          {currentStory.text_overlay?.text && (
            <div
              className="absolute z-20 px-4 py-2 rounded-xl text-center max-w-[85%] font-bold text-lg drop-shadow-md"
              style={{
                color: currentStory.text_overlay.color || '#ffffff',
                backgroundColor: currentStory.text_overlay.bgColor || 'rgba(0,0,0,0.5)',
                top:
                  currentStory.text_overlay.position === 'top'
                    ? '20%'
                    : currentStory.text_overlay.position === 'bottom'
                    ? '70%'
                    : '45%',
              }}
            >
              {currentStory.text_overlay.text}
            </div>
          )}

          {/* Tap navigation zones */}
          <div
            className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
            onClick={handlePrevious}
          />
          <div
            className="absolute inset-y-0 right-0 w-2/3 z-20 cursor-pointer"
            onClick={handleNext}
          />
        </div>

        {/* Bottom Bar: Caption & Reply / Viewer Info */}
        <div className="relative z-30 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent mt-auto text-white">
          {currentStory.caption && (
            <p className="text-sm mb-3 drop-shadow text-white/90">{currentStory.caption}</p>
          )}

          {currentGroup.is_self ? (
            <div className="flex items-center gap-2 text-xs text-white/80 py-1">
              <Eye className="h-4 w-4 text-cyan-400" />
              <span>
                {currentStory.views_count || 0} viewer
                {(currentStory.views_count || 0) === 1 ? '' : 's'}
              </span>
            </div>
          ) : (
            <form onSubmit={handleSendReply} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={replySent ? 'Reply sent! ✨' : `Reply to ${currentGroup.user.display_name}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 h-10 rounded-full border border-white/30 bg-white/20 backdrop-blur-md px-4 text-xs text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Nav Arrow: Right */}
      <button
        type="button"
        onClick={handleNext}
        className="hidden md:flex absolute right-8 z-40 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <ChevronRight className="h-8 w-8" />
      </button>
    </div>
  );
};
