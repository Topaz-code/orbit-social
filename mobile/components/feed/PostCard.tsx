import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  TextInput,
  Modal,
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
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useLikePost } from '../../hooks/useFeed';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';
import { formatRelativeTime } from '../../lib/utils';
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

  const likeMutation = useLikePost();

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

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.user?.display_name || 'Orbit'}: ${post.content_text || ''}`,
      });
    } catch {}
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

  const mediaGallery = Array.isArray(post.media_gallery) && post.media_gallery.length > 0
    ? post.media_gallery
    : post.media_url
    ? [post.media_url]
    : [];

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
        <TouchableOpacity className="p-1.5 text-[#7F8B86] active:opacity-70">
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
