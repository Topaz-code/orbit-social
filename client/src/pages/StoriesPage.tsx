import React, { useState } from 'react';
import { useStories } from '../hooks/useStories.js';
import { useAuthStore } from '../stores/authStore.js';
import { StoryViewer } from '../components/stories/StoryViewer.js';
import { StoryUploadModal } from '../components/stories/StoryUploadModal.js';
import { Button } from '../components/ui/button.js';
import { Avatar } from '../components/ui/avatar.js';
import { EmptyState } from '../components/shared/EmptyState.js';
import { getMediaUrl, formatRelativeTime } from '../lib/utils.js';
import { Flame, Plus } from 'lucide-react';
import { UserStoryGroup } from '../types/index.js';

export const StoriesPage: React.FC = () => {
  const { user } = useAuthStore();
  const { storyGroups, isLoading } = useStories();

  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto min-w-0">
      <div className="flex items-center justify-between p-4 mb-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-500">
            <Flame className="h-5 w-5 fill-amber-500" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">Active Stories</h1>
            <p className="text-xs text-slate-400">Ephemeral 24-hour photo & video updates</p>
          </div>
        </div>

        <Button onClick={() => setIsUploadOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add Story</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading stories...</div>
      ) : storyGroups.length === 0 ? (
        <EmptyState
          icon={<Flame className="h-8 w-8 text-amber-500" />}
          title="No active stories"
          description="Be the first to share an ephemeral story with your friends!"
          actionLabel="Create Story"
          onAction={() => setIsUploadOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {storyGroups.map((group: UserStoryGroup, idx: number) => {
            const firstStory = group.stories[0];
            return (
              <div
                key={group.user.id}
                onClick={() => setSelectedGroupIndex(idx)}
                className="relative aspect-[9/16] rounded-3xl overflow-hidden bg-slate-900 cursor-pointer group shadow-md hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                {/* Media Image / Video Poster */}
                {firstStory && (
                  <img
                    src={getMediaUrl(firstStory.media_url)}
                    alt="Story preview"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 p-4 flex flex-col justify-between text-white">
                  {/* Top user avatar and badge */}
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={group.user.avatar_url}
                      fallback={group.user.display_name}
                      size="sm"
                      className="ring-2 ring-indigo-500"
                    />
                    <span className="text-xs font-bold truncate">{group.user.display_name}</span>
                  </div>

                  {/* Bottom story count & time */}
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-semibold text-white/90 mb-1">
                      {group.stories.length} {group.stories.length === 1 ? 'story' : 'stories'}
                    </span>
                    <p className="text-[10px] text-white/70">
                      {firstStory ? formatRelativeTime(firstStory.created_at) : ''}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedGroupIndex !== null && (
        <StoryViewer
          storyGroups={storyGroups}
          initialGroupIndex={selectedGroupIndex}
          onClose={() => setSelectedGroupIndex(null)}
        />
      )}

      <StoryUploadModal open={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </div>
  );
};
