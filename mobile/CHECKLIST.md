# Deliverables Checklist

- [x] app.json (Expo config with all Android permissions, plugins, Firebase)
- [x] app.config.ts (dynamic config for env variables)
- [x] package.json
- [x] tsconfig.json
- [x] eas.json (EAS Build profiles: development, preview, production)
- [x] babel.config.js (NativeWind plugin)
- [x] tailwind.config.js (NativeWind config matching web theme)
- [x] global.css (NativeWind base styles)
- [x] metro.config.js
- [x] .env (API_URL, SUPABASE_URL, SUPABASE_ANON_KEY, MQTT_URL)
- [x] .env.example
- [x] google-services.json (Firebase Android config)

## assets
- [x] icon.png
- [x] adaptive-icon.png
- [x] splash.png
- [x] fonts/

## app/ (Expo Router)
- [x] _layout.tsx
- [x] index.tsx
- [x] (auth)/_layout.tsx, login.tsx, register.tsx, onboarding.tsx
- [x] (tabs)/_layout.tsx, index.tsx, explore.tsx, messages.tsx, notifications.tsx, profile.tsx
- [x] post/[postId].tsx, create.tsx
- [x] chat/[conversationId].tsx, new.tsx
- [x] stories/viewer.tsx, create.tsx
- [x] groups/index.tsx, [groupId].tsx, create.tsx
- [x] calls/index.tsx, incoming.tsx, active.tsx
- [x] profile/[userId].tsx, edit.tsx
- [x] settings/index.tsx
- [x] search/index.tsx

## components/
- [x] ui/ (Button, Input, Text, Box, VStack, HStack)
- [x] feed/ (PostComposer, PostCard, PostActions, CommentSection, MediaGallery, LinkPreview, StoryBar, FeedSkeleton)
- [x] chat/ (ConversationRow, MessageBubble, ChatInput, VoiceNoteRecorder, TypingIndicator, EmojiPicker, MediaMessage)
- [x] calls/ (IncomingCallScreen, ActiveCallScreen, CallControls, VideoStream, CallHistoryItem)
- [x] stories/ (StoryRing, StoryViewer, StoryProgressBar, StoryCamera)
- [x] profile/ (ProfileHeader, ProfileStats, ProfileTabs, FriendButton)
- [x] groups/ (GroupCard, GroupHeader, MemberRow)
- [x] notifications/ (NotificationItem, NotificationBadge)
- [x] shared/ (Avatar, ImageUploader, VideoPlayer, AudioPlayer, EmptyState, LoadingSkeleton, ErrorRetry, Toast, BottomSheet, PermissionRequest, ColdStartLoader)

## lib/
- [x] api.ts
- [x] mqtt.ts
- [x] supabase.ts
- [x] webrtc.ts
- [x] storage.ts
- [x] secureStorage.ts
- [x] notifications.ts
- [x] permissions.ts
- [x] upload.ts
- [x] constants.ts
- [x] utils.ts

## stores/
- [x] authStore.ts
- [x] chatStore.ts
- [x] callStore.ts
- [x] notificationStore.ts
- [x] themeStore.ts

## hooks/
- [x] useAuth.ts
- [x] useFeed.ts
- [x] useChat.ts
- [x] useMQTT.ts
- [x] useCall.ts
- [x] useStories.ts
- [x] useGroups.ts
- [x] useNotifications.ts
- [x] usePermissions.ts
- [x] useUpload.ts
- [x] usePushNotifications.ts

## types/
- [x] index.ts
