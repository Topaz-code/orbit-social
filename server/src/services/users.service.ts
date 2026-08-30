import { prisma } from '../config/database.js';
import { sanitizeUser, parseJson } from '../utils/helpers.js';

export const usersService = {
  async getUserProfile(targetUserId: string, currentUserId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                visibility: 'public',
              },
            },
            friendships_requested: { where: { status: 'accepted' } },
            friendships_received: { where: { status: 'accepted' } },
            group_members: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked' = 'none';
    let friendshipId: string | null = null;

    if (currentUserId && currentUserId !== targetUserId) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requester_id: currentUserId, addressee_id: targetUserId },
            { requester_id: targetUserId, addressee_id: currentUserId },
          ],
        },
      });

      if (friendship) {
        friendshipId = friendship.id;
        if (friendship.status === 'accepted') {
          friendshipStatus = 'friends';
        } else if (friendship.status === 'blocked') {
          friendshipStatus = 'blocked';
        } else if (friendship.requester_id === currentUserId) {
          friendshipStatus = 'pending_sent';
        } else {
          friendshipStatus = 'pending_received';
        }
      }
    }

    const friendCount = user._count.friendships_requested + user._count.friendships_received;
    const sanitized = sanitizeUser(user);

    // Apply privacy filter for phone number
    const privacy = typeof sanitized.privacy_settings === 'string'
      ? parseJson(sanitized.privacy_settings, {})
      : (sanitized.privacy_settings || {});

    if (privacy.phone === 'nobody' && currentUserId !== targetUserId) {
      delete (sanitized as any).phone;
    } else if (privacy.phone === 'friends' && friendshipStatus !== 'friends' && currentUserId !== targetUserId) {
      delete (sanitized as any).phone;
    }

    return {
      ...sanitized,
      friend_count: friendCount,
      post_count: user._count.posts,
      group_count: user._count.group_members,
      friendship_status: friendshipStatus,
      friendship_id: friendshipId,
      is_self: currentUserId === targetUserId,
    };
  },

  async updateUserProfile(userId: string, data: any) {
    const updateData: any = {};
    if (data.display_name !== undefined) updateData.display_name = data.display_name;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
    if (data.cover_url !== undefined) updateData.cover_url = data.cover_url;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.email !== undefined) updateData.email = data.email.toLowerCase();
    if (data.privacy_settings !== undefined) {
      updateData.privacy_settings =
        typeof data.privacy_settings === 'string'
          ? data.privacy_settings
          : JSON.stringify(data.privacy_settings);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return sanitizeUser(updatedUser);
  },

  async getUserPosts(targetUserId: string, currentUserId?: string, limit = 20, cursor?: string) {
    const isSelf = currentUserId === targetUserId;
    let isFriend = false;

    if (currentUserId && !isSelf) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          status: 'accepted',
          OR: [
            { requester_id: currentUserId, addressee_id: targetUserId },
            { requester_id: targetUserId, addressee_id: currentUserId },
          ],
        },
      });
      isFriend = !!friendship;
    }

    const allowedVisibilities = isSelf
      ? ['public', 'friends', 'private']
      : isFriend
      ? ['public', 'friends']
      : ['public'];

    const posts = await prisma.post.findMany({
      where: {
        user_id: targetUserId,
        visibility: { in: allowedVisibilities },
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { created_at: 'desc' },
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
        likes: currentUserId
          ? {
              where: { user_id: currentUserId },
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
      is_liked: currentUserId ? (post.likes?.length || 0) > 0 : false,
      likes_count: post._count.likes,
      comments_count: post._count.comments,
    }));

    return {
      posts: formattedPosts,
      nextCursor,
    };
  },

  async getUserFriends(targetUserId: string) {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ requester_id: targetUserId }, { addressee_id: targetUserId }],
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            bio: true,
            is_online: true,
            last_seen: true,
          },
        },
        addressee: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            bio: true,
            is_online: true,
            last_seen: true,
          },
        },
      },
    });

    const friends = friendships.map((f) => {
      const friend = f.requester_id === targetUserId ? f.addressee : f.requester;
      return {
        ...friend,
        friendship_id: f.id,
        friends_since: f.created_at,
      };
    });

    return friends;
  },

  async getUserMedia(targetUserId: string, currentUserId?: string) {
    const posts = await prisma.post.findMany({
      where: {
        user_id: targetUserId,
        OR: [
          { media_url: { not: '' } },
          { media_gallery: { not: '[]' } },
        ],
      },
      orderBy: { created_at: 'desc' },
      take: 50,
      select: {
        id: true,
        media_url: true,
        media_type: true,
        media_gallery: true,
        created_at: true,
      },
    });

    const mediaItems: Array<{ id: string; url: string; type: string; postId: string; createdAt: Date }> = [];

    for (const post of posts) {
      if (post.media_url) {
        mediaItems.push({
          id: `${post.id}-main`,
          url: post.media_url,
          type: post.media_type || 'image',
          postId: post.id,
          createdAt: post.created_at,
        });
      }
      const gallery = parseJson<string[]>(post.media_gallery, []);
      gallery.forEach((url, idx) => {
        mediaItems.push({
          id: `${post.id}-gal-${idx}`,
          url,
          type: 'image',
          postId: post.id,
          createdAt: post.created_at,
        });
      });
    }

    return mediaItems;
  },

  async exportUserData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: true,
        comments: true,
        likes: true,
        stories: true,
        friendships_requested: true,
        friendships_received: true,
        group_members: { include: { group: true } },
        notifications: true,
      },
    });

    if (!user) throw new Error('User not found');
    return sanitizeUser(user);
  },

  async deleteAccount(userId: string) {
    await prisma.user.delete({
      where: { id: userId },
    });
    return { success: true, message: 'Account permanently deleted' };
  },
};
