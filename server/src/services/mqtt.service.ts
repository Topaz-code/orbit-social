import { publishMQTT } from '../config/mqtt.js';

export const mqttService = {
  // User Presence
  broadcastUserStatus(userId: string, isOnline: boolean, lastSeen: Date = new Date()) {
    publishMQTT(`orbit/user/${userId}/status`, {
      userId,
      isOnline,
      lastSeen: lastSeen.toISOString(),
    });
  },

  // Push Notifications
  sendNotification(userId: string, notification: any) {
    publishMQTT(`orbit/user/${userId}/notifications`, {
      type: 'NOTIFICATION_RECEIVED',
      data: notification,
    });
  },

  // Chat Messages
  sendMessage(conversationId: string, message: any) {
    publishMQTT(`orbit/chat/${conversationId}/messages`, {
      type: 'MESSAGE_RECEIVED',
      data: message,
    });
  },

  // Typing Indicators
  sendTypingIndicator(conversationId: string, userId: string, username: string, isTyping: boolean) {
    publishMQTT(`orbit/chat/${conversationId}/typing`, {
      conversationId,
      userId,
      username,
      isTyping,
      timestamp: Date.now(),
    });
  },

  // Read Receipts
  sendReadReceipt(conversationId: string, userId: string, messageIds: string[]) {
    publishMQTT(`orbit/chat/${conversationId}/read`, {
      conversationId,
      userId,
      messageIds,
      readAt: new Date().toISOString(),
    });
  },

  // WebRTC Call Signaling
  sendCallSignal(callId: string, signalData: any) {
    publishMQTT(`orbit/call/${callId}/signal`, signalData);
  },

  // Incoming Call Alert
  notifyIncomingCall(userId: string, callData: any) {
    publishMQTT(`orbit/call/${userId}/incoming`, {
      type: 'INCOMING_CALL',
      data: callData,
    });
  },

  // Feed Updates
  broadcastNewPost(post: any) {
    publishMQTT('orbit/feed/new', {
      type: 'POST_CREATED',
      data: post,
    });
  },

  // Post Updates (Likes, Comments)
  broadcastPostUpdate(postId: string, data: any) {
    publishMQTT('orbit/feed/update', {
      type: 'POST_UPDATED',
      postId,
      data,
    });
  },

  // Story Updates
  broadcastNewStory(story: any) {
    publishMQTT('orbit/story/new', {
      type: 'STORY_CREATED',
      data: story,
    });
  },
};
