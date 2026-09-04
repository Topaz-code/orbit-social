import { prisma } from '../config/database.js';
import { parseJson } from '../utils/helpers.js';
import { fetchLinkPreview } from '../utils/linkPreview.js';
import { mqttService } from './mqtt.service.js';
import { moderationService } from './moderation.service.js';
import { pushService } from './push.service.js';

export const postsService = {
  async getFeed(userId: string, limit = 20, cursor?: string) {
    // 1. Get list of friend IDs + user's own ID
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ requester_id: userId }, { addressee_id: userId }],
      },
    });

    const friendIds = friendships.map((f) =>
      f.requester_id === userId ? f.addressee_id : f.requester_id
    );
    const visibleUserIds = [userId, ...friendIds];

    // 2. Fetch posts chronologically (excluding hidden and removed posts)
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          // Own posts (all visibilities)
          { user_id: userId },
          // Friends' posts (public or friends only)
          {
            user_id: { in: friendIds },
            visibility: { in: ['public', 'friends'] },
          },
        ],
        group_id: null, // Feed shows profile/global posts, groups have their own feed
        status: { notIn: ['HIDDEN', 'REMOVED'] },
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { created_at: 'desc' }, // STRICT CHRONOLOGICAL
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_online: true,
          },
        },
        likes: {
          where: { user_id: userId },
          select: { id: true },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem?.id || null;
    }

    const formattedPosts = posts.map((post) => ({
      ...post,
      media_gallery: parseJson(post.media_gallery, []),
      link_preview: parseJson(post.link_preview, null),
      is_liked: (post.likes?.length || 0) > 0,
      likes_count: post._count.likes,
      comments_count: post._count.comments,
    }));

    return {
      posts: formattedPosts,
      nextCursor,
    };
  },

  async getExploreFeed(userId?: string, limit = 20, cursor?: string) {
    const posts = await prisma.post.findMany({
      where: {
        visibility: 'public',
        group_id: null,
        status: { notIn: ['HIDDEN', 'REMOVED'] },
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { created_at: 'desc' }, // STRICT CHRONOLOGICAL
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_online: true,
          },
        },
        likes: userId
          ? {
              where: { user_id: userId },
              select: { id: true },
            }
          : false,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem?.id || null;
    }

    const formattedPosts = posts.map((post) => ({
      ...post,
      media_gallery: parseJson(post.media_gallery, []),
      link_preview: parseJson(post.link_preview, null),
      is_liked: userId ? (post.likes?.length || 0) > 0 : false,
      likes_count: post._count.likes,
      comments_count: post._count.comments,
    }));

    return {
      posts: formattedPosts,
      nextCursor,
    };
  },

  async getPostById(postId: string, userId?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_online: true,
          },
        },
        likes: userId
          ? {
              where: { user_id: userId },
              select: { id: true },
            }
          : false,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!post) throw new Error('Post not found');

    return {
      ...post,
      media_gallery: parseJson(post.media_gallery, []),
      link_preview: parseJson(post.link_preview, null),
      is_liked: userId ? (post.likes?.length || 0) > 0 : false,
      likes_count: post._count.likes,
      comments_count: post._count.comments,
    };
  },

  async createPost(
    userId: string,
    data: {
      content_text: string;
      media_url?: string;
      media_type?: string;
      media_gallery?: string[];
      link_url?: string;
      visibility?: string;
      group_id?: string | null;
    }
  ) {
    // Automated Content Moderation & Link Protection
    const scanResult = await moderationService.scanContent(data.content_text, data.link_url);
    if (!scanResult.isAllowed) {
      throw new Error(scanResult.reason || 'Content rejected by moderation system');
    }

    // If link_url provided or detected in text, auto-generate preview
    let linkPreviewData: any = null;
    let targetLink = data.link_url;

    if (!targetLink) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const match = data.content_text.match(urlRegex);
      if (match && match[0]) {
        targetLink = match[0];
      }
    }

    if (targetLink) {
      linkPreviewData = await fetchLinkPreview(targetLink);
    }

    // Determine media type if not provided
    let mediaType = data.media_type || '';
    if (data.media_url && !mediaType) {
      if (/\.(mp4|webm|mov)$/i.test(data.media_url)) {
        mediaType = 'video';
      } else {
        mediaType = 'image';
      }
    }

    const post = await prisma.post.create({
      data: {
        user_id: userId,
        content_text: data.content_text,
        media_url: data.media_url || '',
        media_type: mediaType,
        media_gallery: JSON.stringify(data.media_gallery || []),
        link_url: targetLink || '',
        link_preview: linkPreviewData ? JSON.stringify(linkPreviewData) : '{}',
        visibility: data.visibility || 'public',
        group_id: data.group_id || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_online: true,
          },
        },
      },
    });

    const formattedPost = {
      ...post,
      media_gallery: parseJson(post.media_gallery, []),
      link_preview: parseJson(post.link_preview, null),
      is_liked: false,
      likes_count: 0,
      comments_count: 0,
    };

    // Broadcast new post via MQTT
    mqttService.broadcastNewPost(formattedPost);

    return formattedPost;
  },

  async updatePost(postId: string, userId: string, data: { content_text?: string; visibility?: string }) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');
    if (post.user_id !== userId) throw new Error('Unauthorized to edit this post');

    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        content_text: data.content_text !== undefined ? data.content_text : post.content_text,
        visibility: data.visibility !== undefined ? data.visibility : post.visibility,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
    });

    return {
      ...updated,
      media_gallery: parseJson(updated.media_gallery, []),
      link_preview: parseJson(updated.link_preview, null),
    };
  },

  async deletePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');
    if (post.user_id !== userId) throw new Error('Unauthorized to delete this post');

    await prisma.post.delete({ where: { id: postId } });
    return { success: true, message: 'Post deleted successfully' };
  },

  async likePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });
    if (!post) throw new Error('Post not found');

    const existingLike = await prisma.like.findUnique({
      where: {
        user_id_post_id: { user_id: userId, post_id: postId },
      },
    });

    if (!existingLike) {
      await prisma.like.create({
        data: {
          user_id: userId,
          post_id: postId,
        },
      });

      // Update post likes_count
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: { likes_count: { increment: 1 } },
      });

      // Create and send notification to post owner if it's not self-like
      if (post.user_id !== userId) {
        const liker = await prisma.user.findUnique({
          where: { id: userId },
          select: { display_name: true, username: true },
        });

        const notification = await prisma.notification.create({
          data: {
            user_id: post.user_id,
            type: 'post_like',
            reference_id: postId,
            reference_type: 'post',
            content: `${liker?.display_name || 'Someone'} liked your post.`,
          },
        });

        mqttService.sendNotification(post.user_id, notification);

        pushService.sendToUser(post.user_id, {
          title: 'New Like ❤️',
          body: `${liker?.display_name || 'Someone'} liked your post.`,
          data: {
            type: 'post_like',
            postId,
            url: `orbit://posts/${postId}`,
          },
        }).catch((err) => console.error('[Push] Like push notification failed:', err));
      }

      mqttService.broadcastPostUpdate(postId, { likes_count: updatedPost.likes_count });

      return { liked: true, likes_count: updatedPost.likes_count };
    }

    return { liked: true, likes_count: post.likes_count };
  },

  async unlikePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');

    const existingLike = await prisma.like.findUnique({
      where: {
        user_id_post_id: { user_id: userId, post_id: postId },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });

      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: { likes_count: { decrement: 1 } },
      });

      mqttService.broadcastPostUpdate(postId, { likes_count: Math.max(0, updatedPost.likes_count) });

      return { liked: false, likes_count: Math.max(0, updatedPost.likes_count) };
    }

    return { liked: false, likes_count: post.likes_count };
  },
};
