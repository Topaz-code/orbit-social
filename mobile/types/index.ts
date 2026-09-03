export interface User {
  id: string;
  username: string;
  phone?: string;
  email?: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  privacy_settings?: Record<string, any>;
  is_online?: boolean;
  post_count?: number;
  friend_count?: number;
  friendship_status?: string;
  created_at?: string;
}

export interface Post {
  id: string;
  user_id: string;
  content_text: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  link_url?: string;
  visibility: 'public' | 'friends' | 'private';
  created_at: string;
  user?: User;
  likes_count: number;
  comments_count: number;
  is_liked_by_me?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  created_at: string;
  user?: User;
  replies?: Comment[];
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  created_at: string;
  expires_at: string;
  user?: User;
  is_viewed?: boolean;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_message?: Message;
  unread_count?: number;
  members: User[];
  other_user?: User;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id?: string;
  sender_id?: string;
  content?: string;
  media_url?: string;
  media_type?: string;
  reply_to_id?: string;
  reply_to?: {
    id: string;
    content?: string;
    sender?: {
      display_name?: string;
      username?: string;
    };
  };
  created_at: string;
  user?: User;
  sender?: User;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface Call {
  id: string;
  caller_id: string;
  receiver_id: string;
  type: 'voice' | 'video';
  status: 'calling' | 'accepted' | 'rejected' | 'ended' | 'missed';
  started_at?: string;
  ended_at?: string;
  duration?: number;
  caller?: User;
  receiver?: User;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  privacy: 'public' | 'private';
  created_at: string;
  members_count?: number;
  member_count?: number;
  members?: any[];
  is_member?: boolean;
}
