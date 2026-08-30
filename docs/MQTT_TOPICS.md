# 📡 Orbit MQTT Topic Catalog & Payload Schemas

Orbit uses an embedded Aedes MQTT broker over WebSockets (`ws://localhost:8883`) for all real-time events. Below is the comprehensive topic reference.

---

## 💬 Chat & Messaging Topics

### 1. `orbit/chat/{conversationId}`
Broadcasts new messages sent within a conversation.

**Publish Event Payload:**
```json
{
  "type": "new_message",
  "data": {
    "id": "msg_123",
    "conversation_id": "conv_456",
    "sender_id": "user_789",
    "sender": {
      "id": "user_789",
      "username": "alexchen",
      "display_name": "Alex Chen",
      "avatar_url": "https://..."
    },
    "content": "Hey! Are you coming to the astronomy meetup?",
    "media_url": null,
    "media_type": "text",
    "created_at": "2026-08-30T01:00:00.000Z"
  }
}
```

### 2. `orbit/chat/{conversationId}/typing`
Broadcasts transient typing indicator events.

**Publish Event Payload:**
```json
{
  "user_id": "user_789",
  "username": "alexchen",
  "is_typing": true
}
```

### 3. `orbit/chat/{conversationId}/read`
Notifies participants when messages have been marked as read.

**Publish Event Payload:**
```json
{
  "type": "messages_read",
  "user_id": "user_789",
  "conversation_id": "conv_456",
  "read_at": "2026-08-30T01:01:00.000Z"
}
```

---

## 🔔 User Personal Topics

### 4. `orbit/user/{userId}/notifications`
Pushes real-time notifications for likes, comments, friend requests, and mentions.

**Publish Event Payload:**
```json
{
  "id": "notif_999",
  "type": "post_like",
  "content": "Sarah Jenkins liked your post",
  "reference_id": "post_101",
  "reference_type": "post",
  "is_read": false,
  "created_at": "2026-08-30T01:05:00.000Z"
}
```

### 5. `orbit/user/{userId}/status`
Broadcasts online presence status changes for friends.

**Publish Event Payload:**
```json
{
  "user_id": "user_789",
  "is_online": true,
  "last_seen_at": "2026-08-30T01:05:00.000Z"
}
```

### 6. `orbit/user/{userId}/call`
Transmits incoming WebRTC voice and video call signaling requests.

**Publish Event Payload:**
```json
{
  "type": "incoming_call",
  "call_id": "call_404",
  "caller": {
    "id": "user_789",
    "username": "alexchen",
    "display_name": "Alex Chen",
    "avatar_url": "https://..."
  },
  "call_type": "video",
  "conversation_id": "conv_456"
}
```

---

## 📝 Global & Group Feed Topics

### 7. `orbit/feed`
Broadcasts newly published public posts in real-time.

### 8. `orbit/group/{groupId}/posts`
Broadcasts newly published posts within a specific micro-group.

### 9. `orbit/stories`
Broadcasts newly published 24-hour stories from friends.
