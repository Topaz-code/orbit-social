import { prisma } from '../config/database.js';

export const conversationsService = {
  async getConversations(userId: string) {
    const memberships = await prisma.conversationMember.findMany({
      where: { user_id: userId },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    display_name: true,
                    avatar_url: true,
                    is_online: true,
                    last_seen: true,
                  },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { created_at: 'desc' },
              include: {
                sender: {
                  select: {
                    id: true,
                    display_name: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const formatted = await Promise.all(
      memberships.map(async (m) => {
        const conv = m.conversation;
        const lastMessage = conv.messages[0] || null;

        // Calculate unread count for this user in this conversation
        const unreadCount = await prisma.message.count({
          where: {
            conversation_id: conv.id,
            sender_id: { not: userId },
            created_at: { gt: m.last_read_at },
          },
        });

        // Determine title and avatar for direct chats vs group chats
        let title = conv.name;
        let avatar = conv.avatar_url;
        let otherUser: any = null;

        if (conv.type === 'direct') {
          const partner = conv.members.find((member) => member.user_id !== userId)?.user;
          if (partner) {
            title = partner.display_name;
            avatar = partner.avatar_url;
            otherUser = partner;
          }
        }

        return {
          id: conv.id,
          type: conv.type,
          name: title || 'Conversation',
          avatar_url: avatar || '',
          group_id: conv.group_id,
          other_user: otherUser,
          members: conv.members.map((mem) => ({
            id: mem.id,
            user_id: mem.user_id,
            role: mem.role,
            user: mem.user,
            last_read_at: mem.last_read_at,
          })),
          last_message: lastMessage,
          unread_count: unreadCount,
          updated_at: lastMessage ? lastMessage.created_at : conv.created_at,
        };
      })
    );

    // Sort by latest message / update
    return formatted.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  },

  async getConversationById(conversationId: string, userId: string) {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                display_name: true,
                avatar_url: true,
                is_online: true,
                last_seen: true,
              },
            },
          },
        },
      },
    });

    if (!conv) throw new Error('Conversation not found');

    const isMember = conv.members.some((m) => m.user_id === userId);
    if (!isMember) throw new Error('Unauthorized to view this conversation');

    let title = conv.name;
    let avatar = conv.avatar_url;
    let otherUser: any = null;

    if (conv.type === 'direct') {
      const partner = conv.members.find((m) => m.user_id !== userId)?.user;
      if (partner) {
        title = partner.display_name;
        avatar = partner.avatar_url;
        otherUser = partner;
      }
    }

    return {
      ...conv,
      name: title || 'Conversation',
      avatar_url: avatar || '',
      other_user: otherUser,
    };
  },

  async createConversation(
    userId: string,
    data: {
      type?: 'direct' | 'group';
      recipient_id?: string;
      participant_ids?: string[];
      name?: string;
      avatar_url?: string;
      group_id?: string;
    }
  ) {
    const type = data.type || 'direct';

    if (type === 'direct') {
      if (!data.recipient_id) throw new Error('Recipient ID is required for direct chat');
      if (data.recipient_id === userId) throw new Error('Cannot start chat with yourself');

      // Check if direct conversation already exists between these 2 users
      const existingConv = await prisma.conversation.findFirst({
        where: {
          type: 'direct',
          AND: [
            { members: { some: { user_id: userId } } },
            { members: { some: { user_id: data.recipient_id } } },
          ],
        },
      });

      if (existingConv) {
        return this.getConversationById(existingConv.id, userId);
      }

      // Create new direct conversation
      const newConv = await prisma.conversation.create({
        data: {
          type: 'direct',
          created_by: userId,
          max_members: 2,
          members: {
            create: [
              { user_id: userId, role: 'admin' },
              { user_id: data.recipient_id, role: 'member' },
            ],
          },
        },
      });

      return this.getConversationById(newConv.id, userId);
    } else {
      // Group conversation
      const participants = Array.from(
        new Set([userId, ...(data.participant_ids || [])])
      );

      if (participants.length > 10) {
        throw new Error('Maximum 10 members allowed in a group conversation');
      }

      const newConv = await prisma.conversation.create({
        data: {
          type: 'group',
          name: data.name || 'Group Chat',
          avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(data.name || 'Group')}`,
          created_by: userId,
          max_members: 10,
          group_id: data.group_id || null,
          members: {
            create: participants.map((pid) => ({
              user_id: pid,
              role: pid === userId ? 'admin' : 'member',
            })),
          },
        },
      });

      return this.getConversationById(newConv.id, userId);
    }
  },

  async markAsRead(conversationId: string, userId: string) {
    const now = new Date();
    await prisma.conversationMember.updateMany({
      where: {
        conversation_id: conversationId,
        user_id: userId,
      },
      data: {
        last_read_at: now,
      },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversation_id: conversationId,
        sender_id: { not: userId },
        is_read: false,
      },
      data: { is_read: true },
    });

    return { success: true, read_at: now.toISOString() };
  },
};
