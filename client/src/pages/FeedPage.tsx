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
        <div className="rounded-2xl border border-[#3A4B4D] bg-[#202A2D] p-4 shadow-xs text-[#D9D0B8]">
          <div className="flex items-center gap-2 mb-3 text-[#D9D0B8] font-bold text-sm">
            <TrendingUp className="h-4 w-4 text-[#D0A56A]" />
            <span>Trending in Orbit</span>
          </div>

          <div className="space-y-2">
            {trending.slice(0, 5).map((item, idx) => (
              <NavLink
                key={idx}
                to={`/search?q=${encodeURIComponent(item.topic)}`}
                className="flex items-center justify-between p-2 rounded-[10px] hover:bg-[#2B3940] transition-colors"
              >
                <span className="text-xs font-semibold text-[#D0A56A]">
                  {item.topic}
                </span>
                <span className="text-[11px] text-[#A8AAA0]">{item.count} posts</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Suggested Friends */}
        <div className="rounded-2xl border border-[#3A4B4D] bg-[#202A2D] p-4 shadow-xs text-[#D9D0B8]">
          <div className="flex items-center gap-2 mb-3 text-[#D9D0B8] font-bold text-sm">
            <Users className="h-4 w-4 text-[#71877B]" />
            <span>Suggested Connections</span>
          </div>

          <div className="space-y-3">
            {suggestedFriends.map((u: User) => (
              <NavLink
                key={u.id}
                to={`/profile/${u.id}`}
                className="flex items-center gap-3 p-1.5 rounded-[10px] hover:bg-[#2B3940] transition-colors group"
              >
                <Avatar src={u.avatar_url} fallback={u.display_name} size="sm" isOnline={u.is_online} showStatus />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#D9D0B8] group-hover:text-[#D0A56A] truncate">
                    {u.display_name}
                  </p>
                  <p className="text-[11px] text-[#A8AAA0] truncate">@{u.username}</p>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

