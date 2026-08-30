import React from 'react';
import { usePosts } from '../hooks/usePosts.js';
import { PostCard } from '../components/feed/PostCard.js';
import { FeedSkeleton } from '../components/feed/FeedSkeleton.js';
import { EmptyState } from '../components/shared/EmptyState.js';
import { Compass } from 'lucide-react';
import { Post } from '../types/index.js';

export const ExplorePage: React.FC = () => {
  const { posts, isLoading, toggleLike, deletePost } = usePosts(true);

  return (
    <div className="max-w-3xl mx-auto min-w-0">
      <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
          <Compass className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">Explore Orbit</h1>
          <p className="text-xs text-slate-400">
            Discover public updates from across the platform in chronological sequence.
          </p>
        </div>
      </div>

      {isLoading ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <EmptyState
          title="No public posts found"
          description="Be the first to share a public post with the Orbit community!"
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post: Post) => (
            <PostCard
              key={post.id}
              post={post}
              onToggleLike={(postId, isLiked, e) => toggleLike({ postId, isLiked, event: e })}
              onDeletePost={deletePost}
            />
          ))}
        </div>
      )}
    </div>
  );
};
