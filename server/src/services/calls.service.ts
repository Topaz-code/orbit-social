import { prisma } from '../config/database.js';
import { mqttService } from './mqtt.service.js';
import { pushService } from './push.service.js';

export const callsService = {
  async getCallHistory(userId: string, limit = 30) {
    const calls = await prisma.call.findMany({
      where: {
        OR: [{ caller_id: userId }, { receiver_id: userId }],
      },
      orderBy: { started_at: 'desc' },
      take: limit,
      include: {
        caller: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
    });

    return calls.map((call) => ({
      ...call,
      is_outgoing: call.caller_id === userId,
      other_user: call.caller_id === userId ? call.receiver : call.caller,
    }));
  },

  async initiateCall(
    callerId: string,
    data: {
      receiver_id: string;
      conversation_id?: string;
      type?: 'voice' | 'video';
    }
  ) {
    if (callerId === data.receiver_id) {
      throw new Error('Cannot call yourself');
    }

    const caller = await prisma.user.findUnique({
      where: { id: callerId },
      select: { id: true, username: true, display_name: true, avatar_url: true },
    });

    if (!caller) throw new Error('Caller not found');

    const receiver = await prisma.user.findUnique({
      where: { id: data.receiver_id },
      select: { id: true, username: true, display_name: true, avatar_url: true },
    });

    if (!receiver) throw new Error('Receiver not found');

    const call = await prisma.call.create({
      data: {
        caller_id: callerId,
        receiver_id: data.receiver_id,
        conversation_id: data.conversation_id || '',
        type: data.type || 'voice',
        status: 'ongoing',
        started_at: new Date(),
      },
      include: {
        caller: {
          select: { id: true, username: true, display_name: true, avatar_url: true },
        },
        receiver: {
          select: { id: true, username: true, display_name: true, avatar_url: true },
        },
      },
    });

    // Notify receiver via MQTT
    mqttService.notifyIncomingCall(data.receiver_id, {
      callId: call.id,
      caller,
      type: call.type,
      conversationId: call.conversation_id,
    });

    // Notify mobile receiver via high-priority FCM Call Wakeup (OS lockscreen intent)
    pushService.sendCallWakeup(data.receiver_id, {
      callId: call.id,
      callerId: caller.id,
      callerName: caller.display_name,
      callerAvatar: caller.avatar_url || '',
      callType: call.type as 'voice' | 'video',
      conversationId: call.conversation_id || '',
    }).catch((err) => console.error('[Call] Push wakeup error:', err));

    return call;
  },

  async updateCall(
    callId: string,
    userId: string,
    data: {
      status: 'ongoing' | 'completed' | 'missed' | 'rejected';
      duration?: number;
    }
  ) {
    const call = await prisma.call.findUnique({ where: { id: callId } });
    if (!call) throw new Error('Call not found');

    if (call.caller_id !== userId && call.receiver_id !== userId) {
      throw new Error('Unauthorized');
    }

    const endedAt = new Date();
    const duration =
      data.duration !== undefined
        ? data.duration
        : Math.max(0, Math.floor((endedAt.getTime() - new Date(call.started_at).getTime()) / 1000));

    const updated = await prisma.call.update({
      where: { id: callId },
      data: {
        status: data.status,
        ended_at: endedAt,
        duration: data.status === 'completed' ? duration : 0,
      },
      include: {
        caller: { select: { id: true, username: true, display_name: true, avatar_url: true } },
        receiver: { select: { id: true, username: true, display_name: true, avatar_url: true } },
      },
    });

    // Notify participants of status change
    const otherUserId = call.caller_id === userId ? call.receiver_id : call.caller_id;
    const signalPayload = {
      type: 'CALL_STATUS_CHANGED',
      callId,
      status: data.status,
      duration: updated.duration,
      byUserId: userId,
    };
    mqttService.sendCallSignal(callId, signalPayload);
    mqttService.sendUserCallSignal(call.caller_id, signalPayload);
    mqttService.sendUserCallSignal(call.receiver_id, signalPayload);

    // If missed or rejected, send notification if receiver missed caller's call
    if (data.status === 'missed' && call.caller_id !== otherUserId) {
      const notification = await prisma.notification.create({
        data: {
          user_id: call.receiver_id,
          type: 'missed_call',
          reference_id: call.id,
          reference_type: 'call',
          content: `Missed ${call.type} call from ${call.caller_id === userId ? 'user' : 'caller'}.`,
        },
      });
      mqttService.sendNotification(call.receiver_id, notification);
    }

    return updated;
  },

  async deleteCall(callId: string, userId: string) {
    const call = await prisma.call.findUnique({ where: { id: callId } });
    if (!call) throw new Error('Call not found');

    if (call.caller_id !== userId && call.receiver_id !== userId) {
      throw new Error('Unauthorized to delete this call log');
    }

    await prisma.call.delete({ where: { id: callId } });
    return { success: true };
  },

  async clearCallHistory(userId: string) {
    // Disabled to prevent data destruction for the other participant.
    // Real implementation should use soft deletes (e.g. cleared_by_caller, cleared_by_receiver).
    return { success: true };
  },
};

