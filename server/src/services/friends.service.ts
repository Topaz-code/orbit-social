import { prisma } from '../config/database.js';
import { mqttService } from './mqtt.service.js';
import { isUserActiveOnline } from '../utils/presence.js';

export const friendsService = {
  async getFriends(userId: string) {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ requester_id: userId }, { addressee_id: userId }],
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

    return friendships.map((f) => {
      const friend = f.requester_id === userId ? f.addressee : f.requester;
      return {
        ...friend,
        is_online: isUserActiveOnline(friend),
        friendship_id: f.id,
        friends_since: f.created_at,
      };
    });
  },


  async getFriendRequests(userId: string) {
    // Incoming requests
    const incoming = await prisma.friendship.findMany({
      where: {
        addressee_id: userId,
        status: 'pending',
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            bio: true,
          },
        },
      },
    });

    // Outgoing requests
    const outgoing = await prisma.friendship.findMany({
      where: {
        requester_id: userId,
        status: 'pending',
      },
      include: {
        addressee: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            bio: true,
          },
        },
      },
    });

    return {
      incoming: incoming.map((req) => ({
        id: req.id,
        user: req.requester,
        created_at: req.created_at,
      })),
      outgoing: outgoing.map((req) => ({
        id: req.id,
        user: req.addressee,
        created_at: req.created_at,
      })),
    };
  },

  async sendFriendRequest(requesterId: string, targetUserId: string) {
    if (requesterId === targetUserId) {
      throw new Error('Cannot add yourself as friend');
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requester_id: requesterId, addressee_id: targetUserId },
          { requester_id: targetUserId, addressee_id: requesterId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'accepted') throw new Error('Already friends');
      if (existing.status === 'blocked') throw new Error('Action not allowed');
      if (existing.requester_id === requesterId) throw new Error('Friend request already sent');
      if (existing.addressee_id === requesterId) {
        // Automatically accept if they already sent a request to you
        return this.acceptFriendRequest(existing.id, requesterId);
      }
    }

    const friendship = await prisma.friendship.create({
      data: {
        requester_id: requesterId,
        addressee_id: targetUserId,
        status: 'pending',
      },
      include: {
        requester: {
          select: { id: true, display_name: true, username: true, avatar_url: true },
        },
      },
    });

    // Send push notification
    const notification = await prisma.notification.create({
      data: {
        user_id: targetUserId,
        type: 'friend_request',
        reference_id: friendship.id,
        reference_type: 'friendship',
        content: `${friendship.requester.display_name} sent you a friend request.`,
      },
    });

    mqttService.sendNotification(targetUserId, notification);

    return friendship;
  },

  async acceptFriendRequest(identifier: string, userId: string) {
    let friendship = await prisma.friendship.findUnique({
      where: { id: identifier },
      include: {
        requester: {
          select: { id: true, display_name: true, username: true },
        },
        addressee: {
          select: { id: true, display_name: true, username: true },
        },
      },
    });

    if (!friendship) {
      friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requester_id: identifier, addressee_id: userId },
            { requester_id: userId, addressee_id: identifier },
          ],
        },
        include: {
          requester: {
            select: { id: true, display_name: true, username: true },
          },
          addressee: {
            select: { id: true, display_name: true, username: true },
          },
        },
      });
    }

    if (!friendship) throw new Error('Friend request not found');
    if (friendship.addressee_id !== userId && friendship.requester_id !== userId) {
      throw new Error('Unauthorized to accept this request');
    }

    const updated = await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: 'accepted' },
    });

    const otherUserId = friendship.requester_id === userId ? friendship.addressee_id : friendship.requester_id;
    const currentUser = friendship.requester_id === userId ? friendship.requester : friendship.addressee;

    // Send notification to the other user
    const notification = await prisma.notification.create({
      data: {
        user_id: otherUserId,
        type: 'friend_accept',
        reference_id: friendship.id,
        reference_type: 'friendship',
        content: `${currentUser.display_name} accepted your friend request!`,
      },
    });

    mqttService.sendNotification(otherUserId, notification);

    return updated;
  },

  async rejectFriendRequest(identifier: string, userId: string) {
    let friendship = await prisma.friendship.findUnique({ where: { id: identifier } });
    if (!friendship) {
      friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requester_id: identifier, addressee_id: userId },
            { requester_id: userId, addressee_id: identifier },
          ],
        },
      });
    }

    if (!friendship) throw new Error('Friend request not found');
    if (friendship.addressee_id !== userId && friendship.requester_id !== userId) {
      throw new Error('Unauthorized to modify this request');
    }

    await prisma.friendship.delete({ where: { id: friendship.id } });
    return { success: true, message: 'Friend request removed' };
  },

  async removeFriend(friendshipId: string, userId: string) {
    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship) throw new Error('Friendship not found');
    if (friendship.requester_id !== userId && friendship.addressee_id !== userId) {
      throw new Error('Unauthorized');
    }

    await prisma.friendship.delete({ where: { id: friendshipId } });
    return { success: true, message: 'Friend removed' };
  },

  async blockUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) throw new Error('Cannot block yourself');

    // Remove any existing friendship or pending request
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { requester_id: currentUserId, addressee_id: targetUserId },
          { requester_id: targetUserId, addressee_id: currentUserId },
        ],
      },
    });

    // Create blocked relationship
    const blocked = await prisma.friendship.create({
      data: {
        requester_id: currentUserId,
        addressee_id: targetUserId,
        status: 'blocked',
      },
    });

    return { success: true, message: 'User blocked' };
  },
};
