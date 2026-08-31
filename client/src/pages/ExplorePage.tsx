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
    <div className="max-w-3xl mx-auto min-w-0 pb-12 text-[#D9D0B8]">
      {/* Header Banner */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-[#202A2D] border border-[#3A4B4D] shadow-xs">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2B3940] border border-[#3A4B4D] text-[#D0A56A]">
          <Compass className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-[#D9D0B8]">Explore Orbit</h1>
          <p className="text-xs text-[#A8AAA0] truncate">
            Discover new people in your network and public updates across Orbit.
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 p-1 bg-[#202A2D] rounded-xl mb-6 border border-[#3A4B4D]">
        <button
          onClick={() => setSearchParams({ tab: 'people' })}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-[8px] text-xs font-bold transition-all ${
            activeTab === 'people'
              ? 'bg-[#496D6B] text-[#D9D0B8] shadow-xs'
              : 'text-[#A8AAA0] hover:text-[#D9D0B8]'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Discover People</span>
          {discoverUsers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-[#2B3940] text-[#D9D0B8] font-semibold border border-[#3A4B4D]">
              {discoverUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'posts' })}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-[8px] text-xs font-bold transition-all ${
            activeTab === 'posts'
              ? 'bg-[#496D6B] text-[#D9D0B8] shadow-xs'
              : 'text-[#A8AAA0] hover:text-[#D9D0B8]'
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
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7F8B86]" />
            <input
              type="text"
              placeholder="Search by name, username, or interests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-[#2B3940] border border-[#3A4B4D] text-xs text-[#D9D0B8] placeholder:text-[#7F8B86] focus:outline-none focus:ring-2 focus:ring-[#496D6B] transition-all shadow-xs"
            />
          </div>

          {isUsersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#202A2D] border border-[#3A4B4D] flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full skeleton-shimmer bg-[#2B3940]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded skeleton-shimmer bg-[#2B3940]" />
                    <div className="h-3 w-48 rounded skeleton-shimmer bg-[#2B3940]" />
                  </div>
                  <div className="h-8 w-24 rounded-[10px] skeleton-shimmer bg-[#2B3940]" />
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
                  className="p-4 rounded-2xl bg-[#202A2D] border border-[#3A4B4D] hover:border-[#496D6B]/50 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                        className="text-sm font-bold text-[#D9D0B8] hover:text-[#D0A56A] transition-colors flex items-center gap-1.5 truncate"
                      >
                        <span className="truncate">{user.display_name}</span>
                      </NavLink>
                      <p className="text-xs text-[#A8AAA0] truncate">@{user.username}</p>
                      {user.bio && (
                        <p className="text-xs text-[#A8AAA0] mt-1 line-clamp-1">
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
                        className="flex items-center gap-1.5 px-3.5 py-1.5 h-8 text-xs font-semibold rounded-[10px] bg-[#D0A56A] hover:bg-[#E0B779] text-[#171A1C] shadow-xs"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Add Friend</span>
                      </Button>
                    )}

                    {user.friendship_status === 'pending_sent' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 h-8 rounded-[10px] bg-[#2B3940] text-[#A8AAA0] text-xs font-medium border border-[#3A4B4D]">
                        <Clock className="h-3.5 w-3.5 text-[#D0A56A]" />
                        <span>Requested</span>
                      </div>
                    )}

                    {user.friendship_status === 'pending_received' && user.friendship_id && (
                      <Button
                        size="sm"
                        onClick={() => acceptRequestMutation.mutate(user.friendship_id!)}
                        disabled={acceptRequestMutation.isPending}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 h-8 text-xs font-semibold rounded-[10px] bg-[#71877B] hover:bg-[#82998C] text-[#171A1C]"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Accept</span>
                      </Button>
                    )}

                    {user.friendship_status === 'friends' && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#71877B] bg-[#71877B]/15 rounded-[8px] border border-[#71877B]/30">
                          <Check className="h-3 w-3" />
                          <span>Friends</span>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/messages')}
                          className="h-8 px-2.5 rounded-[10px] text-[#D9D0B8] hover:bg-[#2B3940]"
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

