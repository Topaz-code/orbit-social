import React, { useState } from 'react';
import { useSearchParams, NavLink, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { usePosts } from '../hooks/usePosts.js';
import { PostCard } from '../components/feed/PostCard.js';
import { FeedSkeleton } from '../components/feed/FeedSkeleton.js';
import { EmptyState } from '../components/shared/EmptyState.js';
import { Avatar } from '../components/ui/avatar.js';
import { Button } from '../components/ui/button.js';
import { Compass, Users, Newspaper, Search, UserPlus, Check, Clock, MessageSquare, Loader2 } from 'lucide-react';
import { Post } from '../types/index.js';

interface DiscoverUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  is_online: boolean;
  last_seen: string;
  friendship_id?: string;
  friendship_status: 'none' | 'friends' | 'pending_sent' | 'pending_received';
}

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'people';
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { posts, isLoading: isPostsLoading, toggleLike, deletePost } = usePosts(true);

  // Discover Users Query
  const { data: discoverUsers = [], isLoading: isUsersLoading } = useQuery<DiscoverUser[]>({
    queryKey: ['discover-users'],
    queryFn: async () => {
      const res = await api.get('/users/discover');
      return res.data?.data || [];
    },
  });

  // Friend Request Mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      await api.post(`/friends/request/${targetUserId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover-users'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  // Accept Request Mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (identifier: string) => {
      await api.post(`/friends/accept/${identifier}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover-users'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friends-list'] });
    },
  });

  // Filtered Users based on search
  const filteredUsers = discoverUsers.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      u.display_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.bio && u.bio.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-3xl mx-auto min-w-0 pb-12">
      {/* Header Banner */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
          <Compass className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">Explore Orbit</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Discover new people in your network and public updates across Orbit.
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl mb-6 border border-slate-200/60 dark:border-slate-800">
        <button
          onClick={() => setSearchParams({ tab: 'people' })}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'people'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Discover People</span>
          {discoverUsers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold">
              {discoverUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'posts' })}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'posts'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Newspaper className="h-4 w-4" />
          <span>Public Posts</span>
        </button>
      </div>

      {/* TAB 1: DISCOVER PEOPLE */}
      {activeTab === 'people' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, username, or interests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
            />
          </div>

          {isUsersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 animate-pulse">
                  <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="h-8 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              title={searchTerm ? "No users matching your search" : "No other users found in orbit"}
              description={searchTerm ? "Try searching for a different name or username" : "Invite your friends to Orbit to start connecting!"}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <NavLink to={`/profile/${user.id}`} className="shrink-0">
                      <Avatar
                        src={user.avatar_url}
                        fallback={user.display_name}
                        isOnline={user.is_online}
                        showStatus={true}
                        size="lg"
                      />
                    </NavLink>
                    <div className="min-w-0 flex-1">
                      <NavLink
                        to={`/profile/${user.id}`}
                        className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 truncate"
                      >
                        <span className="truncate">{user.display_name}</span>
                      </NavLink>
                      <p className="text-xs text-slate-400 truncate">@{user.username}</p>
                      {user.bio && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {user.friendship_status === 'none' && (
                      <Button
                        size="sm"
                        onClick={() => sendRequestMutation.mutate(user.id)}
                        disabled={sendRequestMutation.isPending}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 h-8 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Add Friend</span>
                      </Button>
                    )}

                    {user.friendship_status === 'pending_sent' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-medium border border-slate-200 dark:border-slate-700">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        <span>Requested</span>
                      </div>
                    )}

                    {user.friendship_status === 'pending_received' && user.friendship_id && (
                      <Button
                        size="sm"
                        onClick={() => acceptRequestMutation.mutate(user.friendship_id!)}
                        disabled={acceptRequestMutation.isPending}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 h-8 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Accept</span>
                      </Button>
                    )}

                    {user.friendship_status === 'friends' && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <Check className="h-3 w-3" />
                          <span>Friends</span>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/messages')}
                          className="h-8 px-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PUBLIC POSTS */}
      {activeTab === 'posts' && (
        <div>
          {isPostsLoading ? (
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
      )}
    </div>
  );
};

