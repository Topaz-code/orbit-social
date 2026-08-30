import { prisma } from '../config/database.js';
import { parseJson } from '../utils/helpers.js';
import { fetchLinkPreview } from '../utils/linkPreview.js';
import { mqttService } from './mqtt.service.js';

export const groupsService = {
  async getMyGroups(userId: string) {
    const memberships = await prisma.groupMember.findMany({
      where: { user_id: userId },
      include: {
        group: {
          include: {
            _count: {
              select: {
                members: true,
                posts: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.group,
      member_role: m.role,
      member_count: m.group._count.members,
      post_count: m.group._count.posts,
      is_member: true,
    }));
  },

  async getDiscoverGroups(userId: string) {
    const myMemberships = await prisma.groupMember.findMany({
      where: { user_id: userId },
      select: { group_id: true },
    });
    const myGroupIds = myMemberships.map((m) => m.group_id);

    const publicGroups = await prisma.group.findMany({
      where: {
        privacy: 'public',
        id: { notIn: myGroupIds },
      },
      include: {
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return publicGroups.map((g) => ({
      ...g,
      member_count: g._count.members,
      post_count: g._count.posts,
      is_member: false,
    }));
  },

  async getGroupById(groupId: string, userId?: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                display_name: true,
                avatar_url: true,
                bio: true,
                is_online: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
    });

    if (!group) throw new Error('Group not found');

    const userMembership = userId
      ? group.members.find((m) => m.user_id === userId)
      : null;

    if (group.privacy === 'private' && !userMembership) {
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        avatar_url: group.avatar_url,
        cover_url: group.cover_url,
        privacy: group.privacy,
        member_count: group._count.members,
        is_member: false,
        is_private_locked: true,
      };
    }

    return {
      ...group,
      member_count: group._count.members,
      post_count: group._count.posts,
      is_member: !!userMembership,
      member_role: userMembership?.role || null,
      is_admin: userMembership?.role === 'admin' || group.created_by === userId,
      is_moderator: userMembership?.role === 'moderator' || userMembership?.role === 'admin',
    };
  },

  async createGroup(
    userId: string,
    data: {
      name: string;
      description?: string;
      avatar_url?: string;
      cover_url?: string;
      privacy?: 'public' | 'private';
      initial_member_ids?: string[];
    }
  ) {
    const initialMembers = Array.from(
      new Set([userId, ...(data.initial_member_ids || [])])
    );

    if (initialMembers.length > 10) {
      throw new Error('Groups are limited to a maximum of 10 members');
    }

    const defaultAvatar =
      data.avatar_url ||
      `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(data.name)}`;
    const defaultCover =
      data.cover_url ||
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80';

    const group = await prisma.group.create({
      data: {
        name: data.name,
        description: data.description || '',
        avatar_url: defaultAvatar,
        cover_url: defaultCover,
        privacy: data.privacy || 'public',
        created_by: userId,
        max_members: 10,
        members: {
          create: initialMembers.map((mid) => ({
            user_id: mid,
            role: mid === userId ? 'admin' : 'member',
          })),
        },
      },
      include: {
        members: {
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
        },
      },
    });

    // Also automatically create a group conversation for group chat
    await prisma.conversation.create({
      data: {
        type: 'group',
        name: group.name,
        avatar_url: group.avatar_url,
        created_by: userId,
        group_id: group.id,
        max_members: 10,
        members: {
          create: initialMembers.map((mid) => ({
            user_id: mid,
            role: mid === userId ? 'admin' : 'member',
          })),
        },
      },
    });

    return group;
  },

  async updateGroup(
    groupId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      avatar_url?: string;
      cover_url?: string;
      privacy?: 'public' | 'private';
    }
  ) {
    const member = await prisma.groupMember.findUnique({
      where: {
        group_id_user_id: { group_id: groupId, user_id: userId },
      },
    });

    if (!member || (member.role !== 'admin' && member.role !== 'moderator')) {
      throw new Error('Unauthorized: only group admins can update group settings');
    }

    const updated = await prisma.group.update({
      where: { id: groupId },
      data,
    });

    return updated;
  },

  async deleteGroup(groupId: string, userId: string) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new Error('Group not found');
    if (group.created_by !== userId) {
      throw new Error('Unauthorized: only the group creator can delete this group');
    }

    await prisma.group.delete({ where: { id: groupId } });
    return { success: true, message: 'Group deleted successfully' };
  },

  async joinGroup(groupId: string, userId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (!group) throw new Error('Group not found');

    if (group._count.members >= group.max_members) {
      throw new Error('This group is full (maximum 10 members)');
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: {
        group_id_user_id: { group_id: groupId, user_id: userId },
      },
    });

    if (existingMember) {
      return { success: true, message: 'Already a member of this group' };
    }

    await prisma.groupMember.create({
      data: {
        group_id: groupId,
        user_id: userId,
        role: 'member',
      },
    });

    // Add to associated group conversation if one exists
    const groupConv = await prisma.conversation.findFirst({
      where: { group_id: groupId },
    });

    if (groupConv) {
      await prisma.conversationMember.createMany({
        data: [{ conversation_id: groupConv.id, user_id: userId, role: 'member' }],
        // Skip duplicate
      }).catch(() => {});
    }

    return { success: true, message: 'Joined group successfully' };
  },

  async leaveGroup(groupId: string, userId: string) {
    const member = await prisma.groupMember.findUnique({
      where: {
        group_id_user_id: { group_id: groupId, user_id: userId },
      },
    });

    if (!member) throw new Error('You are not a member of this group');

    await prisma.groupMember.delete({
      where: { id: member.id },
    });

    // Remove from group conversation
    const groupConv = await prisma.conversation.findFirst({
      where: { group_id: groupId },
    });
    if (groupConv) {
      await prisma.conversationMember.deleteMany({
        where: { conversation_id: groupConv.id, user_id: userId },
      });
    }

    return { success: true, message: 'Left group successfully' };
  },

  async addMember(groupId: string, adminUserId: string, targetUserId: string, role = 'member') {
    const adminMember = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: adminUserId } },
    });

    if (!adminMember || adminMember.role !== 'admin') {
      throw new Error('Unauthorized: only group admins can add members');
    }

    const currentCount = await prisma.groupMember.count({ where: { group_id: groupId } });
    if (currentCount >= 10) {
      throw new Error('Group is at maximum capacity (10 members)');
    }

    await prisma.groupMember.create({
      data: {
        group_id: groupId,
        user_id: targetUserId,
        role,
      },
    });

    // Add to group conversation
    const groupConv = await prisma.conversation.findFirst({
      where: { group_id: groupId },
    });
    if (groupConv) {
      await prisma.conversationMember.createMany({
        data: [{ conversation_id: groupConv.id, user_id: targetUserId, role }],
      }).catch(() => {});
    }

    return { success: true, message: 'Member added successfully' };
  },

  async removeMember(groupId: string, adminUserId: string, targetUserId: string) {
    const adminMember = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: adminUserId } },
    });

    if (!adminMember || adminMember.role !== 'admin') {
      throw new Error('Unauthorized: only group admins can remove members');
    }

    await prisma.groupMember.deleteMany({
      where: { group_id: groupId, user_id: targetUserId },
    });

    const groupConv = await prisma.conversation.findFirst({
      where: { group_id: groupId },
    });
    if (groupConv) {
      await prisma.conversationMember.deleteMany({
        where: { conversation_id: groupConv.id, user_id: targetUserId },
      });
    }

    return { success: true, message: 'Member removed' };
  },

  async getGroupPosts(groupId: string, userId: string, limit = 20, cursor?: string) {
    const posts = await prisma.post.findMany({
      where: { group_id: groupId },
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

    return { posts: formattedPosts, nextCursor };
  },

  async createGroupPost(groupId: string, userId: string, data: any) {
    const member = await prisma.groupMember.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });

    if (!member) throw new Error('You must be a member of this group to post');

    let linkPreviewData: any = null;
    if (data.link_url) {
      linkPreviewData = await fetchLinkPreview(data.link_url);
    }

    const post = await prisma.post.create({
      data: {
        user_id: userId,
        group_id: groupId,
        content_text: data.content_text,
        media_url: data.media_url || '',
        media_type: data.media_type || '',
        media_gallery: JSON.stringify(data.media_gallery || []),
        link_url: data.link_url || '',
        link_preview: linkPreviewData ? JSON.stringify(linkPreviewData) : '{}',
        visibility: 'public',
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
      ...post,
      media_gallery: parseJson(post.media_gallery, []),
      link_preview: parseJson(post.link_preview, null),
      is_liked: false,
      likes_count: 0,
      comments_count: 0,
    };
  },
};
