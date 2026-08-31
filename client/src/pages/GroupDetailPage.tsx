import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuthStore } from '../stores/authStore.js';
import { Group, Post } from '../types/index.js';
import { Avatar } from '../components/ui/avatar.js';
import { Button } from '../components/ui/button.js';
import { Badge } from '../components/ui/badge.js';
import { PostComposer } from '../components/feed/PostComposer.js';
import { PostCard } from '../components/feed/PostCard.js';
import { MemberList } from '../components/groups/MemberList.js';
import { EmptyState } from '../components/shared/EmptyState.js';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs.js';
import { Users, Globe, Lock, LogOut, UserPlus, ArrowLeft } from 'lucide-react';
import { MAX_GROUP_MEMBERS } from '../lib/constants.js';

export const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('feed');

  // Fetch Group Info & Members
  const { data: group, isLoading, refetch } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`/groups/${id}`);
      return res.data?.data as Group;
    },
    enabled: !!id,
  });

  // Fetch Group Feed Posts
  const { data: posts = [], refetch: refetchPosts } = useQuery({
    queryKey: ['group-posts', id],
    queryFn: async () => {
      if (!id) return [];
      const res = await api.get(`/groups/${id}/posts`);
      return (res.data?.data || []) as Post[];
    },
    enabled: !!id && group?.is_member,
  });

  // Join Group Mutation
  const joinMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/groups/${id}/members`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  // Leave Group Mutation
  const leaveMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/groups/${id}/members/${currentUser?.id}`);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading group details..." />;
  }

  if (!group) {
    return (
      <EmptyState
        title="Group not found"
        description="The group you requested does not exist or has been removed."
      />
    );
  }

  const isAdmin = group.is_admin || group.member_role === 'admin';
  const isFull = (group.member_count || 0) >= MAX_GROUP_MEMBERS;

  return (
    <div className="max-w-4xl mx-auto min-w-0 text-[#D9D0B8]">
      {/* Back to groups */}
      <button
        type="button"
        onClick={() => navigate('/groups')}
        className="flex items-center gap-1 text-xs font-semibold text-[#A8AAA0] hover:text-[#D9D0B8] mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Groups</span>
      </button>

      {/* Group Banner & Header */}
      <div className="rounded-3xl border border-[#3A4B4D] bg-[#202A2D] overflow-hidden shadow-xs mb-6">
        <div className="h-48 sm:h-56 w-full bg-[#171A1C] overflow-hidden relative">
          <img
            src={group.cover_url}
            alt={group.name}
            className="h-full w-full object-cover opacity-90"
          />
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider">
            {group.privacy === 'public' ? (
              <Globe className="h-3.5 w-3.5 text-[#71877B]" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-[#D0A56A]" />
            )}
            <span>{group.privacy} Group</span>
          </div>
        </div>

        <div className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-14 sm:-mt-16 gap-4 mb-4">
            <Avatar
              src={group.avatar_url}
              fallback={group.name}
              size="xl"
              className="ring-4 ring-[#202A2D] shadow-xl"
            />

            <div className="flex items-center gap-2">
              {group.is_member ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => leaveMutation.mutate()}
                  isLoading={leaveMutation.isPending}
                  className="hover:text-[#B87568] hover:border-[#B87568] border-[#3A4B4D] text-[#D9D0B8]"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  <span>Leave Group</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => joinMutation.mutate()}
                  isLoading={joinMutation.isPending}
                  disabled={isFull}
                  className="bg-[#D0A56A] text-[#171A1C] hover:bg-[#E0B779] rounded-[10px]"
                >
                  <UserPlus className="h-4 w-4 mr-1.5 stroke-[2.5]" />
                  <span>{isFull ? 'Group Full' : 'Join Group'}</span>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#D9D0B8] tracking-tight">
                {group.name}
              </h1>
              <Badge variant={isFull ? 'destructive' : 'cyan'}>
                {group.member_count}/{MAX_GROUP_MEMBERS} Members
              </Badge>
            </div>

            <p className="text-sm text-[#A8AAA0] max-w-2xl leading-relaxed">
              {group.description || 'No description provided.'}
            </p>
          </div>
        </div>
      </div>


      {/* Group Feed & Members Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="feed">Group Feed</TabsTrigger>
          <TabsTrigger value="members">Members ({group.members?.length || group.member_count})</TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          {group.is_member ? (
            <>
              <PostComposer
                groupId={group.id}
                onPostCreated={() => refetchPosts()}
              />

              {posts.length === 0 ? (
                <EmptyState
                  title="No posts in this group yet"
                  description="Be the first to share an update or question with your fellow group members!"
                />
              ) : (
                <div className="space-y-4">
                  {posts.map((post: Post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onToggleLike={() => refetchPosts()}
                      onDeletePost={() => refetchPosts()}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={<Lock className="h-8 w-8 text-indigo-600" />}
              title="Members Only"
              description="Join this group to view and participate in discussions."
              actionLabel={isFull ? 'Group Full' : 'Join Group'}
              onAction={isFull ? undefined : () => joinMutation.mutate()}
            />
          )}
        </TabsContent>

        <TabsContent value="members">
          <MemberList
            members={group.members || []}
            isAdmin={isAdmin}
            currentUserId={currentUser?.id}
            onRemoveMember={async (userId) => {
              await api.delete(`/groups/${group.id}/members/${userId}`);
              refetch();
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
