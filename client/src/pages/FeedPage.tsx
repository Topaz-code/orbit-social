import React from 'react';
import { usePosts } from '../hooks/usePosts.js';
import { StoryBar } from '../components/stories/StoryBar.js';
import { PostComposer } from '../components/feed/PostComposer.js';
import { PostCard } from '../components/feed/PostCard.js';
import { FeedSkeleton } from '../components/feed/FeedSkeleton.js';
import { EmptyState } from '../components/shared/EmptyState.js';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { NavLink, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/avatar.js';
import { TrendingUp, Users } from 'lucide-react';
import { User, Post } from '../types/index.js';

export const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { posts, isLoading, toggleLike, deletePost, refetch } = usePosts(false);

  // Trending Topics Query
  const { data: trending = [] } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      const res = await api.get('/search/trending');
      return (res.data?.data || []) as Array<{ topic: string; count: number }>;
    },
  });

  // Suggested Friends Query (Only non-friends)
  const { data: suggestedFriends = [] } = useQuery({
    queryKey: ['suggested-friends'],
    queryFn: async () => {
      const res = await api.get('/users/suggested');
      return (res.data?.data?.slice(0, 5) || []) as User[];
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Center Feed Column */}
      <div className="lg:col-span-8 min-w-0">
        {/* Story Bar */}
        <StoryBar />

        {/* Post Composer */}
        <PostComposer onPostCreated={() => refetch()} />

        {/* Posts Stream */}
        {isLoading ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <EmptyState
            title="Your orbit is quiet"
            description="Connect with friends or join groups to see posts in your chronological feed!"
            actionLabel="Discover People"
            onAction={() => navigate('/explore?tab=people')}
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

      {/* Right Sidebar Column (Trending & Suggested) */}
      <div className="hidden lg:block lg:col-span-4 space-y-6 sticky top-20">
        {/* Trending Hashtags */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-slate-100 font-bold text-sm">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
            <span>Trending in Orbit</span>
          </div>

          <div className="space-y-2">
            {trending.slice(0, 5).map((item, idx) => (
              <NavLink
                key={idx}
                to={`/search?q=${encodeURIComponent(item.topic)}`}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {item.topic}
                </span>
                <span className="text-[11px] text-slate-400">{item.count} posts</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Suggested Friends */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-slate-100 font-bold text-sm">
            <Users className="h-4 w-4 text-purple-600" />
            <span>Suggested Connections</span>
          </div>

          <div className="space-y-3">
            {suggestedFriends.map((u: User) => (
              <NavLink
                key={u.id}
                to={`/profile/${u.id}`}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
              >
                <Avatar src={u.avatar_url} fallback={u.display_name} size="sm" isOnline={u.is_online} showStatus />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 truncate">
                    {u.display_name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">@{u.username}</p>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
