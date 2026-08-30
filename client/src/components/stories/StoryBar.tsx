import React, { useState } from 'react';
import { useStories } from '../../hooks/useStories.js';
import { useAuthStore } from '../../stores/authStore.js';
import { StoryRing } from './StoryRing.js';
import { StoryViewer } from './StoryViewer.js';
import { StoryUploadModal } from './StoryUploadModal.js';
import { Plus } from 'lucide-react';
import { UserStoryGroup } from '../../types/index.js';

export const StoryBar: React.FC = () => {
  const { user } = useAuthStore();
  const { storyGroups, isLoading } = useStories();

  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const ownGroup = storyGroups.find((g) => g.is_self);
  const otherGroups = storyGroups.filter((g) => !g.is_self);

  return (
    <>
      <div className="flex items-center gap-3.5 overflow-x-auto py-2 px-1 mb-6 no-scrollbar select-none">
        {/* Add / View Your Story */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
          <div className="relative">
            {ownGroup ? (
              <StoryRing
                avatarUrl={user?.avatar_url}
                displayName={user?.display_name || 'You'}
                hasUnseenStory={!ownGroup.all_viewed}
                onClick={() => {
                  const idx = storyGroups.findIndex((g) => g.is_self);
                  if (idx !== -1) setSelectedGroupIndex(idx);
                }}
              />
            ) : (
              <div
                onClick={() => setIsUploadOpen(true)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-indigo-400 dark:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all"
              >
                <Plus className="h-6 w-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsUploadOpen(true);
              }}
              className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white ring-2 ring-white dark:ring-slate-900 shadow-sm"
              title="Add story"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 max-w-[64px] truncate text-center">
            {ownGroup ? 'Your Story' : 'Add Story'}
          </span>
        </div>

        {/* Other Users' Stories */}
        {otherGroups.map((group) => {
          const globalIndex = storyGroups.findIndex((g) => g.user.id === group.user.id);
          return (
            <div
              key={group.user.id}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
              onClick={() => setSelectedGroupIndex(globalIndex)}
            >
              <StoryRing
                avatarUrl={group.user.avatar_url}
                displayName={group.user.display_name}
                hasUnseenStory={!group.all_viewed}
              />
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 max-w-[64px] truncate text-center">
                {group.user.display_name.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Story Viewer Modal */}
      {selectedGroupIndex !== null && (
        <StoryViewer
          storyGroups={storyGroups}
          initialGroupIndex={selectedGroupIndex}
          onClose={() => setSelectedGroupIndex(null)}
        />
      )}

      {/* Story Upload Modal */}
      <StoryUploadModal open={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </>
  );
};
