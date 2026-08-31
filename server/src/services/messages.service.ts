import { prisma } from '../config/database.js';
import { mqttService } from './mqtt.service.js';
import { pushService } from './push.service.js';

export const messagesService = {
  async getMessages(conversationId: string, userId: string, limit = 50, cursor?: string) {
    // Verify membership
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: { conversation_id: conversationId, user_id: userId },
      },
    });

    if (!member) throw new Error('Unauthorized to view this chat');

    const messages = await prisma.message.findMany({
      where: { conversation_id: conversationId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { created_at: 'desc' }, // Latest first for cursor pagination
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_online: true,
          },
        },
        reply_to: {
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
    });

    let nextCursor: string | null = null;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id || null;
    }

    // Return chronological (oldest to newest) for chat stream rendering
    return {
      messages: messages.reverse(),
      nextCursor,
    };
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    data: {
      content?: string;
      media_url?: string;
      media_type?: string;
      reply_to_id?: string | null;
    }
  ) {
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: { conversation_id: conversationId, user_id: senderId },
      },
      include: {
        conversation: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!member) throw new Error('Unauthorized: you are not a member of this chat');

    const message = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_id: senderId,
        content: data.content || '',
        media_url: data.media_url || '',
        media_type: data.media_type || 'text',
        reply_to_id: data.reply_to_id || null,
        is_read: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_online: true,
          },
        },
        reply_to: {
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
    });

    // Update conversation member last_read_at for sender
    await prisma.conversationMember.update({
      where: { id: member.id },
      data: { last_read_at: new Date() },
    });

    // Broadcast message via MQTT to conversation topic
    mqttService.sendMessage(conversationId, message);

    // Send notifications to offline or other members
    const senderName = message.sender.display_name;
    const previewContent =
      data.media_type === 'image'
        ? '📷 Photo'
        : data.media_type === 'video'
        ? '🎥 Video'
        : data.media_type === 'voice'
        ? '🎙️ Voice message'
        : data.media_type === 'file'
        ? '📎 Attachment'
        : data.content || 'New message';

    for (const mem of member.conversation.members) {
      if (mem.user_id !== senderId) {
        // Send MQTT real-time notification
        const notification = {
          type: 'new_message',
          reference_id: conversationId,
          reference_type: 'conversation',
          content: `${senderName}: ${previewContent}`,
          sender: message.sender,
          message_id: message.id,
        };
        mqttService.sendNotification(mem.user_id, notification);

        // Send Mobile Push Notification (FCM v1)
        pushService.sendToUser(mem.user_id, {
          title: senderName,
          body: previewContent,
          data: {
            type: 'CHAT_MESSAGE',
            conversationId,
            messageId: message.id,
            senderId,
          },
        }).catch((err) => console.error('[Message] Push notification error:', err));
      }
    }

    return message;
  },

  async deleteMessage(messageId: string, userId: string, forEveryone = false) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new Error('Message not found');

    if (forEveryone) {
      if (message.sender_id !== userId) {
        throw new Error('Unauthorized to delete this message for everyone');
      }
      await prisma.message.delete({ where: { id: messageId } });
      return { success: true, message: 'Message deleted for everyone' };
    }

    // If deleting just for self, we could hide it or delete if sender
    if (message.sender_id === userId) {
      await prisma.message.delete({ where: { id: messageId } });
    }

    return { success: true, message: 'Message deleted' };
  },
};
