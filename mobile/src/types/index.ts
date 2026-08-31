export interface User {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  is_online?: boolean;
  friend_count?: number;
  post_count?: number;
  created_at?: string;
}

export interface Post {
  id: string;
  user_id: string;
  content_text: string;
  media_url?: string;
  media_type?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    is_online?: boolean;
  };
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface Conversation {
  id: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    is_online?: boolean;
  };
  last_message?: {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
}

export interface Friend {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  is_online?: boolean;
}

export interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  user: User;
}
