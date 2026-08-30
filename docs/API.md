# 📡 Orbit REST API Specification

All API endpoints are mounted at `/api`. Responses are serialized as JSON and adhere to a standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation description"
}
```

---

## 🔐 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Log in with username/email/phone + password | No |
| `POST` | `/api/auth/refresh` | Exchange refresh token for new access token | No |
| `POST` | `/api/auth/logout` | Invalidate current session | Yes |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & stats | Yes |
| `GET` | `/api/auth/security-question` | Retrieve security question for username/email | No |
| `POST` | `/api/auth/reset-password` | Reset password using security answer | No |
| `POST` | `/api/auth/change-password` | Change password while authenticated | Yes |

---

## 👤 2. Users (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users/:id` | Get user profile with friendship status | Yes |
| `PUT` | `/api/users/:id` | Update profile information | Yes (Self) |
| `GET` | `/api/users/:id/posts` | Get user chronological post timeline | Yes |
| `GET` | `/api/users/:id/friends` | List confirmed friends for user | Yes |
| `GET` | `/api/users/:id/groups` | List user micro-groups | Yes |
| `GET` | `/api/users/:id/media` | List media attachments uploaded by user | Yes |
| `GET` | `/api/users/:id/export` | Export entire user account archive (JSON) | Yes (Self) |

---

## 📝 3. Posts & Feed (`/api/posts`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/posts/feed` | Strictly chronological home news feed | Yes |
| `GET` | `/api/posts/explore` | Strictly chronological public discover feed | Yes |
| `POST` | `/api/posts` | Create new post (media, text, link, privacy) | Yes |
| `GET` | `/api/posts/:id` | Get single post details with comments | Yes |
| `PUT` | `/api/posts/:id` | Update post content | Yes (Author) |
| `DELETE` | `/api/posts/:id` | Delete post and cascade relations | Yes (Author) |
| `POST` | `/api/posts/:id/like` | Like a post | Yes |
| `DELETE` | `/api/posts/:id/like` | Remove like from a post | Yes |
| `GET` | `/api/posts/:id/comments` | Get threaded comments for a post | Yes |
| `POST` | `/api/posts/:id/comments` | Add comment or 1-level reply | Yes |

---

## 💬 4. Conversations & Messages (`/api/conversations`, `/api/messages`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/conversations` | List user direct & group chat threads | Yes |
| `POST` | `/api/conversations` | Start new direct or group chat thread | Yes |
| `GET` | `/api/conversations/:id` | Get conversation details and members | Yes |
| `GET` | `/api/conversations/:id/messages` | Get paginated message history | Yes |
| `POST` | `/api/conversations/:id/messages` | Send message (text, media, voice note) | Yes |
| `PUT` | `/api/conversations/:id/read` | Mark all messages in conversation as read | Yes |
| `DELETE` | `/api/messages/:id` | Delete message (for me or everyone) | Yes |

---

## 👥 5. Micro-Groups (`/api/groups`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/groups` | List user joined groups and discoverable groups | Yes |
| `POST` | `/api/groups` | Create group (enforces max 10 members) | Yes |
| `GET` | `/api/groups/:id` | Get group details, member count, user role | Yes |
| `PUT` | `/api/groups/:id` | Update group name, description, privacy | Yes (Admin) |
| `DELETE` | `/api/groups/:id` | Delete group | Yes (Admin) |
| `GET` | `/api/groups/:id/members` | List members and admin roles | Yes |
| `POST` | `/api/groups/:id/members` | Join group or invite user (max 10 check) | Yes |
| `DELETE` | `/api/groups/:id/members/:userId` | Leave group or remove member | Yes |
| `GET` | `/api/groups/:id/posts` | Get group chronological post feed | Yes (Member) |

---

## ⏳ 6. Stories (`/api/stories`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/stories/feed` | List active stories grouped by user | Yes |
| `POST` | `/api/stories` | Upload 24h ephemeral story with text overlay | Yes |
| `GET` | `/api/stories/:id` | Get story details | Yes |
| `POST` | `/api/stories/:id/view` | Record view receipt for story | Yes |
| `DELETE` | `/api/stories/:id` | Delete active story | Yes (Owner) |

---

## 🤝 7. Friendships (`/api/friends`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/friends/requests` | List pending incoming and outgoing requests | Yes |
| `POST` | `/api/friends/request/:userId` | Send friend request | Yes |
| `POST` | `/api/friends/accept/:friendshipId` | Accept friend request | Yes |
| `POST` | `/api/friends/reject/:friendshipId` | Reject friend request | Yes |
| `DELETE` | `/api/friends/:friendshipId` | Remove friend connection | Yes |

---

## 📞 8. Calls (`/api/calls`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/calls/initiate` | Initiate WebRTC voice/video call record | Yes |
| `PUT` | `/api/calls/:id/status` | Update call status (answered, rejected, ended) | Yes |
| `GET` | `/api/calls/history` | Get past call history and durations | Yes |

---

## 🔍 9. Search (`/api/search`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/search?q=...&type=...` | Unified search across people, posts, groups | Yes |
| `GET` | `/api/search/trending` | List trending hashtags across Orbit posts | Yes |

---

## 📁 10. File Uploads (`/api/upload`)

| Method | Endpoint | Description | Content-Type |
|---|---|---|---|
| `POST` | `/api/upload` | Upload single media file (images, video, audio) | `multipart/form-data` |
| `POST` | `/api/upload/multiple` | Upload up to 10 media files | `multipart/form-data` |
