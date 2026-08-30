import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuthStore } from '../stores/authStore.js';
import { useMediaUpload } from '../hooks/useMediaUpload.js';
import { User, Post } from '../types/index.js';
import { ProfileHeader } from '../components/profile/ProfileHeader.js';
import { ProfileEditModal } from '../components/profile/ProfileEditModal.js';
import { FriendCard } from '../components/profile/FriendCard.js';
import { PostCard } from '../components/feed/PostCard.js';
import { PostComposer } from '../components/feed/PostComposer.js';
import { EmptyState } from '../components/shared/EmptyState.js';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.js';
import { ImageCropper } from '../components/shared/ImageCropper.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs.js';
import { GroupCard } from '../components/groups/GroupCard.js';
import { getMediaUrl } from '../lib/utils.js';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { uploadFile } = useMediaUpload();

  const targetUserId = id || currentUser?.id;
  const isSelf = currentUser?.id === targetUserId;

  const [activeTab, setActiveTab] = useState('posts');
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Image Cropper states
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [cropType, setCropType] = useState<'avatar' | 'cover'>('avatar');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch User Profile
  const { data: profile, isLoading: isLoadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['user', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      const res = await api.get(`/users/${targetUserId}`);
      return res.data?.data as User;
    },
    enabled: !!targetUserId,
  });

  // 2. Fetch User Posts
  const { data: postsData, isLoading: isLoadingPosts, refetch: refetchPosts } = useQuery({
    queryKey: ['user-posts', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return { posts: [] };
      const res = await api.get(`/users/${targetUserId}/posts`);
      return res.data?.data as { posts: Post[] };
    },
    enabled: !!targetUserId,
  });

  // 3. Fetch User Friends
  const { data: friends = [] } = useQuery({
    queryKey: ['user-friends', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const res = await api.get(`/users/${targetUserId}/friends`);
      return res.data?.data || [];
    },
    enabled: !!targetUserId,
  });

  // 4. Fetch User Media
  const { data: mediaItems = [] } = useQuery({
    queryKey: ['user-media', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const res = await api.get(`/users/${targetUserId}/media`);
      return res.data?.data || [];
    },
    enabled: !!targetUserId,
  });

  // 5. Friend Request Mutations
  const sendFriendRequest = async () => {
    if (!targetUserId) return;
    await api.post(`/friends/request/${targetUserId}`);
    refetchProfile();
  };

  const removeFriend = async () => {
    if (profile?.friendship_id) {
      await api.delete(`/friends/${profile.friendship_id}`);
      refetchProfile();
    }
  };

  // Image Selection Handlers
  const handleSelectAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropType('avatar');
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropType('cover');
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (blob: Blob) => {
    const file = new File(
      [blob],
      `${cropType}-${Date.now()}.jpg`,
      { type: 'image/jpeg' }
    );

    try {
      const uploadRes = await uploadFile(file, cropType === 'avatar' ? 'avatars' : 'covers');
      if (cropType === 'avatar') {
        await api.put(`/users/${currentUser?.id}`, { avatar_url: uploadRes.url });
      } else {
        await api.put(`/users/${currentUser?.id}`, { cover_url: uploadRes.url });
      }
      await refetchProfile();
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      if (currentUser) {
        setUser({
          ...currentUser,
          avatar_url: cropType === 'avatar' ? uploadRes.url : currentUser.avatar_url,
          cover_url: cropType === 'cover' ? uploadRes.url : currentUser.cover_url,
        });
      }
    } catch (err) {
      console.error('Failed to save cropped image:', err);
    }
  };

  if (isLoadingProfile) {
    return <LoadingSpinner label="Loading profile..." />;
  }

  if (!profile) {
    return (
      <EmptyState
        title="User not found"
        description="The requested profile does not exist or has been deleted."
      />
    );
  }

  const posts = postsData?.posts || [];

  return (
    <div className="max-w-4xl mx-auto min-w-0">
      {/* Hidden File Inputs for Avatar/Cover */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleSelectAvatar}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={coverInputRef}
        onChange={handleSelectCover}
        accept="image/*"
        className="hidden"
      />

      {/* Profile Header */}
      <ProfileHeader
        user={profile}
        isSelf={isSelf}
        onOpenEdit={() => setIsEditOpen(true)}
        onSendFriendRequest={sendFriendRequest}
        onRemoveFriend={removeFriend}
        friendshipStatus={profile.friendship_status}
        onUpdateAvatar={() => avatarInputRef.current?.click()}
        onUpdateCover={() => coverInputRef.current?.click()}
      />

      {/* Profile Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="posts">Posts ({profile.post_count || 0})</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="friends">Friends ({profile.friend_count || 0})</TabsTrigger>
          <TabsTrigger value="media">Media ({mediaItems.length})</TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-6">
          {isSelf && <PostComposer onPostCreated={() => refetchPosts()} />}

          {isLoadingPosts ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading timeline...</div>
          ) : posts.length === 0 ? (
            <EmptyState
              title="No posts yet"
              description={
                isSelf
                  ? 'Share your first thought or photo with your friends!'
                  : `${profile.display_name} hasn't posted anything yet.`
              }
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
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="mt-6">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">About {profile.display_name}</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {profile.bio || 'No bio provided.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Username:</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">@{profile.username}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Email:</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{profile.email}</p>
              </div>
              {profile.phone && (
                <div>
                  <span className="text-slate-400 font-medium">Phone:</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{profile.phone}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Friends Tab */}
        <TabsContent value="friends" className="mt-6">
          {friends.length === 0 ? (
            <EmptyState
              title="No friends listed"
              description="No connections established yet."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {friends.map((friend: any) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  isSelf={isSelf}
                  onRemoveFriend={() => {
                    refetchProfile();
                    queryClient.invalidateQueries({ queryKey: ['user-friends'] });
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="mt-6">
          {mediaItems.length === 0 ? (
            <EmptyState
              title="No media uploaded"
              description="Photos and videos shared in posts will appear here."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {mediaItems.map((item: any) => (
                <div
                  key={item.id}
                  className="aspect-square rounded-2xl overflow-hidden bg-slate-900 group relative"
                >
                  <img
                    src={getMediaUrl(item.url)}
                    alt="Media item"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Profile Modal */}
      {isSelf && (
        <ProfileEditModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          user={profile}
        />
      )}

      {/* Image Crop Modal */}
      <ImageCropper
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={cropImageSrc}
        aspectRatio={cropType === 'avatar' ? 'square' : 'cover'}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
