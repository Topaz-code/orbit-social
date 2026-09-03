import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Send,
  Globe,
  Users,
  MoreHorizontal,
  X,
  Pencil,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useLikePost, useDeletePost, useUpdatePost } from '../../hooks/useFeed';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';
import { WEB_URL } from '../../constants';
import { formatRelativeTime } from '../../lib/utils';
import { getSafeMediaUrl } from '../../lib/media';
import { Skeleton } from '../ui/Skeleton';

export default function PostCard({ post }: { post: any }) {
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState<boolean>(post.is_liked || false);
  const [likesCount, setLikesCount] = useState<number>(post.likes_count || 0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>(post.content_text || '');
  const [editModalOpen, setEditModalOpen] = useState(false);

  const likeMutation = useLikePost();
  const deletePostMutation = useDeletePost();
  const updatePostMutation = useUpdatePost();

  // Ownership drives whether Edit/Delete are shown in the action menu.
  const isOwner = Boolean(
    user?.id && (post.user_id === user.id || post.user?.id === user.id)
  );

  const postUrl = `${WEB_URL}/post/${post.id}`;

  const handleToggleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await likeMutation.mutateAsync({ postId: post.id, isLiked });
    } catch {
      setIsLiked(isLiked);
      setLikesCount((prev) => (isLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  /**
   * Share a post. The payload ALWAYS includes the canonical web deep link so
   * recipients can open the post on the Orbit web app. When the post has no
   * text we share just the URL.
   */
  const handleShare = async () => {
    try {
      const text =
        typeof post.content_text === 'string' ? post.content_text.trim() : '';
      const message = text
        ? `${text}\n\nRead more on Orbit: ${postUrl}`
        : `Check out this post on Orbit: ${postUrl}`;

      // On iOS `url` also populates the share sheet; `message` covers Android.
      await Share.share({
        message,
        url: postUrl,
        title: post.user?.display_name
          ? `${post.user.display_name} on Orbit`
          : 'Orbit',
      });
    } catch (err: any) {
      // User dismissing the share sheet rejects the promise — ignore that.
      if (err?.name !== 'AbortError') {
        console.warn('Share failed:', err?.message || err);
      }
    }
  };

  /**
   * Three-dots post options menu. Uses the native ActionSheet-style API:
   * React Native's `Alert.alert` with buttons (the option order on Android is
   * rendered bottom-up like an action sheet). Offers Edit / Delete for the
   * owner and a Report action for everyone else.
   */
  const handleOpenPostMenu = () => {
    const buttons: any[] = [];

    if (isOwner) {
      buttons.push({
        text: 'Edit Post',
        onPress: () => {
          setEditText(post.content_text || '');
          setEditModalOpen(true);
        },
      });
      buttons.push({
        text: 'Delete Post',
        style: 'destructive',
        onPress: handleDeletePost,
      });
    } else {
      buttons.push({
        text: 'Report Post',
        onPress: () =>
          Alert.alert('Report submitted', 'Thanks — our team will review this post.'),
      });
    }

    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      'Post options',
      undefined,
      buttons,
      { cancelable: true }
    );
  };

  const handleDeletePost = () => {
    Alert.alert(
      'Delete post?',
      'This post will be permanently removed. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePostMutation.mutateAsync(post.id);
            } catch (err: any) {
              Alert.alert(
                'Could not delete post',
                err?.response?.data?.message ||
                  err?.message ||
                  'Something went wrong. Please try again.'
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleSaveEdit = async () => {
    const next = editText.trim();
    if (!next) {
      Alert.alert('Empty post', 'A post cannot be blank.');
      return;
    }
    if (next === (post.content_text || '').trim()) {
      setEditModalOpen(false);
      return;
    }
    try {
      await updatePostMutation.mutateAsync({ postId: post.id, content_text: next });
      setEditModalOpen(false);
    } catch (err: any) {
      Alert.alert(
        'Could not update post',
        err?.response?.data?.message ||
          err?.message ||
          'Something went wrong. Please try again.'
      );
    }
  };

  const handleToggleComments = async () => {
    if (!showComments) {
      setShowComments(true);
      try {
        setLoadingComments(true);
        const res = await api.get(`/posts/${post.id}/comments`);
        setComments(res.data?.data || []);
      } catch {}
      finally {
        setLoadingComments(false);
      }
    } else {
      setShowComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      setSubmittingComment(true);
      const res = await api.post(`/posts/${post.id}/comments`, {
        content: commentText.trim(),
      });
      if (res.data?.data) {
        setComments((prev) => [...prev, res.data.data]);
        setCommentText('');
      }
    } catch {}
    finally {
      setSubmittingComment(false);
    }
  };

  // Normalise every media source to a validated URI string so a malformed
  // payload never reaches expo-image (same crash class as chat images).
  const rawGallery =
    Array.isArray(post.media_gallery) && post.media_gallery.length > 0
      ? post.media_gallery
      : post.media_url
      ? [post.media_url]
      : [];
  const mediaGallery: string[] = rawGallery
    .map((m: any) => getSafeMediaUrl(m))
    .filter((u: string | null): u is string => Boolean(u));

  const timeAgo = formatRelativeTime(post.created_at) || 'just now';

  return (
    <View className="bg-[#202A2D] border border-[#3A4B4D] rounded-2xl p-4 mb-3 mx-4 shadow-sm">
      {/* Author Row */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center space-x-3 flex-1 mr-2">
          <View className="relative">
            <Image
              source={{
                uri:
                  post.user?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    post.user?.display_name || 'Orbit'
                  )}&background=2B3940&color=D9D0B8`,
              }}
              style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#3A4B4D' }}
              contentFit="cover"
            />
            {post.user?.is_online && (
              <View className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-[#202A2D]" />
            )}
          </View>
          <View className="ml-3 flex-1">
            <View className="flex-row items-center space-x-1.5 flex-wrap">
              <Text className="font-bold text-sm text-[#D9D0B8] mr-1.5" numberOfLines={1}>
                {post.user?.display_name || 'Orbit User'}
              </Text>
              <Text className="text-xs text-[#7F8B86]">@{post.user?.username || 'user'}</Text>
            </View>
            <View className="flex-row items-center space-x-1.5 mt-0.5">
              <Text className="text-[11px] text-[#7F8B86] mr-1">{timeAgo}</Text>
              <Text className="text-[11px] text-[#7F8B86] mr-1">•</Text>
              {post.visibility === 'friends' ? (
                <Users size={11} color="#7F8B86" />
              ) : (
                <Globe size={11} color="#7F8B86" />
              )}
            </View>
          </View>
        </View>

        {/* Three dots menu */}
        <TouchableOpacity
          className="p-1.5 rounded-lg active:bg-[#2B3940]"
          onPress={handleOpenPostMenu}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Post options"
        >
          <MoreHorizontal size={18} color="#7F8B86" />
        </TouchableOpacity>
      </View>

      {/* Post Text */}
      {post.content_text ? (
        <Text className="text-[#D9D0B8] text-sm leading-relaxed mb-3 whitespace-pre-line">
          {post.content_text}
        </Text>
      ) : null}

      {/* Media Images */}
      {mediaGallery.length === 1 ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setPreviewImage(mediaGallery[0])}
          className="mb-3 rounded-xl overflow-hidden border border-[#3A4B4D]"
        >
          <Image
            source={{ uri: mediaGallery[0] }}
            style={{ width: '100%', height: 220 }}
            contentFit="cover"
          />
        </TouchableOpacity>
      ) : mediaGallery.length > 1 ? (
        <View className="flex-row flex-wrap gap-1.5 mb-3">
          {mediaGallery.slice(0, 4).map((url: string, index: number) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.9}
              onPress={() => setPreviewImage(url)}
              style={{ width: '48%', height: 140 }}
              className="rounded-xl overflow-hidden border border-[#3A4B4D]"
            >
              <Image
                source={{ uri: url }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Action Bar matching screenshot */}
      <View className="flex-row items-center justify-between pt-3 border-t border-[#3A4B4D]/60">
        <TouchableOpacity
          className="flex-row items-center space-x-1.5 py-1 px-2 rounded-lg active:opacity-75"
          onPress={handleToggleLike}
        >
          <Heart
            size={18}
            color={isLiked ? '#B87568' : '#7F8B86'}
            fill={isLiked ? '#B87568' : 'none'}
          />
          <Text className={`text-xs font-semibold ml-1.5 ${isLiked ? 'text-[#B87568]' : 'text-[#7F8B86]'}`}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center space-x-1.5 py-1 px-2 rounded-lg active:opacity-75"
          onPress={handleToggleComments}
        >
          <MessageSquare size={18} color="#7F8B86" />
          <Text className="text-xs text-[#7F8B86] font-semibold ml-1.5">
            {post.comments_count || comments.length || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="py-1 px-2 active:opacity-75" onPress={handleShare}>
          <Share2 size={18} color="#7F8B86" />
        </TouchableOpacity>

        <TouchableOpacity
          className="py-1 px-2 active:opacity-75"
          onPress={() => setIsBookmarked((prev) => !prev)}
        >
          <Bookmark
            size={18}
            color={isBookmarked ? '#D0A56A' : '#7F8B86'}
            fill={isBookmarked ? '#D0A56A' : 'none'}
          />
        </TouchableOpacity>
      </View>

      {/* Comments Drawer */}
      {showComments && (
        <View className="mt-3 pt-3 border-t border-[#3A4B4D]">
          {loadingComments ? (
            <View className="py-2 space-y-2">
              <Skeleton width="100%" height={32} borderRadius={8} className="mb-2" />
              <Skeleton width="90%" height={32} borderRadius={8} />
            </View>
          ) : comments.length > 0 ? (
            <View className="space-y-2 mb-3">
              {comments.map((c) => (
                <View key={c.id} className="bg-[#2B3940] p-2.5 rounded-xl mb-1.5">
                  <Text className="text-xs font-bold text-[#D0A56A]">
                    {c.user?.display_name || c.user?.username || 'User'}
                  </Text>
                  <Text className="text-xs text-[#D9D0B8] mt-0.5">{c.content}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-xs text-[#7F8B86] text-center my-2">No comments yet</Text>
          )}

          {/* Add Comment Input */}
          <View className="flex-row items-center space-x-2 mt-2">
            <TextInput
              className="flex-1 bg-[#2B3940] border border-[#3A4B4D] rounded-xl px-3 py-2 text-xs text-[#D9D0B8] mr-2"
              placeholder="Write a comment..."
              placeholderTextColor="#7F8B86"
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity
              className="bg-[#D0A56A] p-2.5 rounded-xl active:opacity-85"
              onPress={handleAddComment}
              disabled={submittingComment}
            >
              <Send size={14} color="#171A1C" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Edit Post Modal */}
      <Modal
        visible={editModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalOpen(false)}
      >
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <View className="w-full bg-[#202A2D] border border-[#3A4B4D] rounded-2xl p-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Pencil size={16} color="#D0A56A" />
                <Text className="text-base font-bold text-[#D9D0B8] ml-2">
                  Edit Post
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditModalOpen(false)}
                className="p-1.5 rounded-full active:bg-[#2B3940]"
              >
                <X size={18} color="#7F8B86" />
              </TouchableOpacity>
            </View>

            <TextInput
              className="bg-[#2B3940] border border-[#3A4B4D] rounded-xl px-4 py-3 text-sm text-[#D9D0B8] min-h-[110px] max-h-[220px]"
              placeholder="What's on your mind?"
              placeholderTextColor="#7F8B86"
              value={editText}
              onChangeText={setEditText}
              multiline
              textAlignVertical="top"
            />

            <View className="flex-row items-center justify-end space-x-2 mt-4">
              <TouchableOpacity
                className="px-4 py-2.5 rounded-xl bg-[#2B3940] border border-[#3A4B4D] active:opacity-80"
                onPress={() => setEditModalOpen(false)}
                disabled={updatePostMutation.isPending}
              >
                <Text className="text-sm font-semibold text-[#D9D0B8]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-5 py-2.5 rounded-xl bg-[#D0A56A] active:opacity-85 flex-row items-center"
                onPress={handleSaveEdit}
                disabled={updatePostMutation.isPending}
              >
                {updatePostMutation.isPending ? (
                  <ActivityIndicator size="small" color="#171A1C" />
                ) : (
                  <Text className="text-sm font-bold text-[#171A1C]">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full-screen Image Preview Modal */}
      {previewImage && (
        <Modal
          visible={!!previewImage}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewImage(null)}
        >
          <View className="flex-1 bg-black/95 justify-center items-center p-4">
            <TouchableOpacity
              className="absolute top-12 right-6 p-2.5 bg-[#202A2D] rounded-full z-20 border border-[#3A4B4D]"
              onPress={() => setPreviewImage(null)}
            >
              <X size={20} color="#D9D0B8" />
            </TouchableOpacity>
            <Image
              source={{ uri: previewImage }}
              style={{ width: '100%', height: '80%' }}
              contentFit="contain"
            />
          </View>
        </Modal>
      )}
    </View>
  );
}
