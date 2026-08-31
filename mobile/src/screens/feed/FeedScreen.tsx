import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Image,
} from 'react-native';
import { api } from '../../services/api';
import { Post, Comment } from '../../types';
import { useAuthStore } from '../../stores/authStore';

export const FeedScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [posting, setPosting] = useState(false);

  // Comments Sheet State
  const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await api.get('/posts');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPosts(res.data.data);
      }
    } catch (e) {
      console.warn('[Feed] Error fetching posts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;

    setPosting(true);
    try {
      const res = await api.post('/posts', {
        content_text: newPostText.trim(),
        visibility: 'public',
      });
      if (res.data?.success && res.data?.data) {
        setPosts((prev) => [res.data.data, ...prev]);
        setNewPostText('');
      }
    } catch (e) {
      console.warn('[Feed] Error creating post:', e);
    } finally {
      setPosting(false);
    }
  };

  const handleToggleLike = async (post: Post) => {
    const isLiked = post.is_liked;
    const updatedLikesCount = isLiked ? Math.max(0, post.likes_count - 1) : post.likes_count + 1;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, is_liked: !isLiked, likes_count: updatedLikesCount } : p
      )
    );

    try {
      if (isLiked) {
        await api.delete(`/posts/${post.id}/like`);
      } else {
        await api.post(`/posts/${post.id}/like`);
      }
    } catch (e) {
      console.warn('[Feed] Like error, reverting:', e);
      // Revert on error
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, is_liked: isLiked, likes_count: post.likes_count } : p
        )
      );
    }
  };

  const openComments = async (post: Post) => {
    setActivePostForComments(post);
    setLoadingComments(true);
    try {
      const res = await api.get(`/comments/post/${post.id}`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setComments(res.data.data);
      } else {
        setComments([]);
      }
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async () => {
    if (!newCommentText.trim() || !activePostForComments) return;

    setSubmittingComment(true);
    try {
      const res = await api.post('/comments', {
        post_id: activePostForComments.id,
        content: newCommentText.trim(),
      });
      if (res.data?.success && res.data?.data) {
        setComments((prev) => [...prev, res.data.data]);
        setNewCommentText('');
        // Update post comment count
        setPosts((prev) =>
          prev.map((p) =>
            p.id === activePostForComments.id
              ? { ...p, comments_count: (p.comments_count || 0) + 1 }
              : p
          )
        );
      }
    } catch (e) {
      console.warn('[Feed] Comment submission error:', e);
    } finally {
      setSubmittingComment(false);
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    const authorName = item.user?.display_name || item.user?.username || 'Orbit User';
    const authorInitial = authorName.charAt(0).toUpperCase();

    return (
      <View style={styles.postCard}>
        {/* Author Header */}
        <View style={styles.postHeader}>
          <View style={styles.avatarCircle}>
            {item.user?.avatar_url ? (
              <Image source={{ uri: item.user.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{authorInitial}</Text>
            )}
          </View>
          <View style={styles.authorMeta}>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.authorHandle}>@{item.user?.username || 'user'}</Text>
          </View>
        </View>

        {/* Content */}
        <Text style={styles.postBody}>{item.content_text}</Text>

        {item.media_url && (
          <Image source={{ uri: item.media_url }} style={styles.postMedia} resizeMode="cover" />
        )}

        {/* Actions Row */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleLike(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionIcon, item.is_liked && styles.likedHeart]}>
              {item.is_liked ? '❤️' : '🤍'}
            </Text>
            <Text style={[styles.actionCount, item.is_liked && styles.likedCount]}>
              {item.likes_count || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openComments(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{item.comments_count || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Create Post Header Card */}
      <View style={styles.createCard}>
        <View style={styles.createRow}>
          <View style={styles.userAvatarSmall}>
            <Text style={styles.avatarTextSmall}>
              {user?.display_name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <TextInput
            style={styles.createInput}
            placeholder="Share an update on Orbit..."
            placeholderTextColor="#6B7280"
            value={newPostText}
            onChangeText={setNewPostText}
            multiline
          />
        </View>
        {newPostText.trim().length > 0 && (
          <View style={styles.createActionRow}>
            <TouchableOpacity
              style={[styles.postButton, posting && styles.buttonDisabled]}
              onPress={handleCreatePost}
              disabled={posting}
            >
              {posting ? (
                <ActivityIndicator size="small" color="#171A1C" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Feed List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#D0A56A" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchPosts();
              }}
              tintColor="#D0A56A"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>Be the first to share in your circle!</Text>
            </View>
          }
        />
      )}

      {/* Comments Modal */}
      <Modal
        visible={!!activePostForComments}
        animationType="slide"
        transparent
        onRequestClose={() => setActivePostForComments(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setActivePostForComments(null)}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingComments ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="small" color="#D0A56A" />
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.commentsList}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.avatarTextSmall}>
                        {item.user?.display_name?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.commentBody}>
                      <Text style={styles.commentAuthor}>
                        {item.user?.display_name || item.user?.username}
                      </Text>
                      <Text style={styles.commentText}>{item.content}</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.noCommentsText}>No comments yet. Start the conversation!</Text>
                }
              />
            )}

            {/* Write comment input */}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor="#6B7280"
                value={newCommentText}
                onChangeText={setNewCommentText}
              />
              <TouchableOpacity
                style={[styles.sendCommentButton, submittingComment && styles.buttonDisabled]}
                onPress={handleSendComment}
                disabled={submittingComment}
              >
                <Text style={styles.sendCommentText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171A1C',
  },
  createCard: {
    backgroundColor: '#202428',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#2D3339',
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  userAvatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextSmall: {
    color: '#D9D0B8',
    fontWeight: '700',
    fontSize: 14,
  },
  createInput: {
    flex: 1,
    color: '#F3F4F6',
    fontSize: 15,
    paddingTop: 8,
    minHeight: 40,
  },
  createActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  postButton: {
    backgroundColor: '#D0A56A',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonText: {
    color: '#171A1C',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  listContent: {
    padding: 14,
    paddingBottom: 40,
  },
  postCard: {
    backgroundColor: '#202428',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2D3339',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2C3238',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#3E464F',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#D9D0B8',
    fontWeight: '700',
    fontSize: 16,
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '700',
  },
  authorHandle: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  postBody: {
    color: '#E5E7EB',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  postMedia: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderTopWidth: 1,
    borderColor: '#2C3238',
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionCount: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  likedHeart: {
    fontSize: 17,
  },
  likedCount: {
    color: '#F87171',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    color: '#D9D0B8',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#6B7280',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#202428',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '45%',
    padding: 18,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#2D3339',
    paddingBottom: 10,
  },
  modalTitle: {
    color: '#F3F4F6',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 6,
  },
  closeText: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '700',
  },
  commentsList: {
    paddingVertical: 8,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentBody: {
    flex: 1,
    backgroundColor: '#171A1C',
    padding: 10,
    borderRadius: 12,
  },
  commentAuthor: {
    color: '#D0A56A',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  commentText: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  noCommentsText: {
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 30,
    fontSize: 14,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: '#2D3339',
    paddingTop: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#171A1C',
    color: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sendCommentButton: {
    backgroundColor: '#D0A56A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sendCommentText: {
    color: '#171A1C',
    fontWeight: '700',
    fontSize: 14,
  },
});
