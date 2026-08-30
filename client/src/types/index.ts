export interface User {
  id: string;
  username: string;
  display_name: string;
  email: string;
  phone?: string | null;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  is_online?: boolean;
  last_seen?: string;
  privacy_settings?: PrivacySettings;
  security_question?: string;
  created_at: string;
  friend_count?: number;
  post_count?: number;
  group_count?: number;
  friendship_status?: 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked';
  friendship_id?: string | null;
  is_self?: boolean;
}

export interface PrivacySettings {
  posts: 'everyone' | 'friends' | 'nobody';
  messages: 'everyone' | 'friends' | 'nobody';
  phone: 'everyone' | 'friends' | 'nobody';
  onlineStatus: 'everyone' | 'friends' | 'nobody';
  stories: 'everyone' | 'friends' | 'custom';
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image: string;
  domain: string;
}

export interface Post {
  id: string;
  user_id: string;
  content_text: string;
  media_url?: string;
  media_type?: string;
  media_gallery?: string[];
  link_url?: string;
  link_preview?: LinkPreview | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  visibility: 'public' | 'friends' | 'private';
  group_id?: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    is_online?: boolean;
  };
  is_liked: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id?: string | null;
  content: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    is_online?: boolean;
  };
  replies?: Comment[];
}

export interface TextOverlay {
  text: string;
  color?: string;
  bgColor?: string;
  fontSize?: number;
  position?: 'top' | 'center' | 'bottom';
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  text_overlay?: TextOverlay | null;
  viewers: string[];
  viewer_users?: Array<{
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  }>;
  expires_at: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  is_viewed?: boolean;
  views_count?: number;
}

export interface UserStoryGroup {
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  is_self: boolean;
  all_viewed: boolean;
  latest_created_at: string;
  stories: Story[];
}

export interface ConversationMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  last_read_at: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    is_online?: boolean;
    last_seen?: string;
  };
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatar_url?: string;
  group_id?: string | null;
  members: ConversationMember[];
  other_user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    is_online?: boolean;
    last_seen?: string;
  } | null;
  last_message?: Message | null;
  unread_count: number;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  media_url?: string;
  media_type: 'text' | 'image' | 'video' | 'file' | 'voice';
  reply_to_id?: string | null;
  reply_to?: {
    id: string;
    content?: string;
    media_type?: string;
    sender: {
      id: string;
      display_name: string;
      username: string;
    };
  } | null;
  is_read: boolean;
  created_at: string;
  sender: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    is_online?: boolean;
  };
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    bio?: string;
    is_online?: boolean;
  };
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar_url: string;
  cover_url: string;
  created_by: string;
  max_members: number;
  privacy: 'public' | 'private';
  invite_code?: string;
  created_at: string;
  member_count: number;
  post_count: number;
  is_member?: boolean;
  member_role?: 'admin' | 'moderator' | 'member' | null;
  is_admin?: boolean;
  is_moderator?: boolean;
  members?: GroupMember[];
  is_private_locked?: boolean;
}

export interface FriendshipRequest {
  id: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    bio?: string;
  };
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type:
    | 'friend_request'
    | 'friend_accept'
    | 'post_like'
    | 'post_comment'
    | 'post_share'
    | 'mention'
    | 'new_message'
    | 'group_invite'
    | 'group_post'
    | 'story_reply'
    | 'missed_call';
  reference_id?: string;
  reference_type?: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface CallRecord {
  id: string;
  caller_id: string;
  receiver_id: string;
  conversation_id?: string;
  type: 'voice' | 'video';
  status: 'ongoing' | 'completed' | 'missed' | 'rejected';
  started_at: string;
  ended_at?: string;
  duration: number;
  is_outgoing: boolean;
  other_user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export interface ActiveCallState {
  callId: string;
  type: 'voice' | 'video';
  isIncoming: boolean;
  isCaller: boolean;
  remoteUser: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  status: 'ringing' | 'connected' | 'ended';
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  duration: number;
}
