import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { User, Post, Group } from '../types/index.js';
import { PostCard } from '../components/feed/PostCard.js';
import { FriendCard } from '../components/profile/FriendCard.js';
import { GroupCard } from '../components/groups/GroupCard.js';
import { EmptyState } from '../components/shared/EmptyState.js';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs.js';
import { Search } from 'lucide-react';
import { triggerHeartBurst } from '../lib/utils.js';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query.trim() });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['search', searchParams.get('q') || ''],
    queryFn: async () => {
      const q = searchParams.get('q') || '';
      if (!q.trim()) return { people: [], posts: [], groups: [] };
      const res = await api.get(`/search?q=${encodeURIComponent(q)}&type=all`);
      return res.data?.data as {
        people: User[];
        posts: Post[];
        groups: Group[];
      };
    },
    enabled: true,
  });

  const people = data?.people || [];
  const posts = data?.posts || [];
  const groups = data?.groups || [];

  const totalResults = people.length + posts.length + groups.length;

  const queryClient = useQueryClient();
  const currentQ = searchParams.get('q') || '';

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean; event?: React.MouseEvent }) => {
      if (isLiked) {
        const res = await api.delete(`/posts/${postId}/like`);
        return { postId, liked: false, likes_count: res.data?.data?.likes_count };
      } else {
        const res = await api.post(`/posts/${postId}/like`);
        return { postId, liked: true, likes_count: res.data?.data?.likes_count };
      }
    },
    onMutate: async ({ postId, isLiked, event }) => {
      if (!isLiked && event) {
        triggerHeartBurst(event);
      }
      await queryClient.cancelQueries({ queryKey: ['search', currentQ] });
      const previous = queryClient.getQueryData<any>(['search', currentQ]);
      queryClient.setQueryData<any>(['search', currentQ], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          posts: old.posts?.map((p: Post) => {
            if (p.id === postId) {
              return {
                ...p,
                is_liked: !isLiked,
                likes_count: isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1,
              };
            }
            return p;
          }),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['search', currentQ], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['search', currentQ] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  return (
    <div className="max-w-4xl mx-auto min-w-0 text-[#D9D0B8]">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7F8B86]" />
          <input
            type="text"
            placeholder="Search for people, posts, hashtags, or groups..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-12 rounded-2xl border border-[#3A4B4D] bg-[#202A2D] pl-12 pr-4 text-sm text-[#D9D0B8] placeholder:text-[#7F8B86] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#496D6B]"
          />
        </div>
      </form>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
          <TabsTrigger value="people">People ({people.length})</TabsTrigger>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="groups">Groups ({groups.length})</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <LoadingSpinner label="Searching..." />
        ) : totalResults === 0 && (searchParams.get('q') || '').trim() ? (
          <EmptyState
            title="No results found"
            description={`We couldn't find anything matching "${searchParams.get('q')}". Try searching for a different keyword.`}
          />
        ) : (
          <>
            {/* ALL TAB */}
            <TabsContent value="all" className="space-y-8">
              {people.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-[#D9D0B8] mb-3">
                    People
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {people.slice(0, 4).map((p: User) => (
                      <FriendCard key={p.id} friend={p} />
                    ))}
                  </div>
                </div>
              )}

              {groups.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-[#D9D0B8] mb-3">
                    Groups
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {groups.slice(0, 2).map((g: Group) => (
                      <GroupCard key={g.id} group={g} />
                    ))}
                  </div>
                </div>
              )}

              {posts.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-[#D9D0B8] mb-3">
                    Posts
                  </h3>
                  <div className="space-y-4">
                    {posts.map((post: Post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onToggleLike={(postId, isLiked, e) =>
                          toggleLikeMutation.mutate({ postId, isLiked, event: e })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* PEOPLE TAB */}
            <TabsContent value="people">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {people.map((p: User) => (
                  <FriendCard key={p.id} friend={p} />
                ))}
              </div>
            </TabsContent>

            {/* POSTS TAB */}
            <TabsContent value="posts">
              <div className="space-y-4">
                {posts.map((post: Post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onToggleLike={(postId, isLiked, e) =>
                      toggleLikeMutation.mutate({ postId, isLiked, event: e })
                    }
                  />
                ))}
              </div>
            </TabsContent>

            {/* GROUPS TAB */}
            <TabsContent value="groups">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groups.map((g: Group) => (
                  <GroupCard key={g.id} group={g} />
                ))}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );

};
