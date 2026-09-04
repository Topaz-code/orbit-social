import { Request } from 'express';

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  role?: 'USER' | 'MODERATOR' | 'ADMIN' | string;
  is_banned?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export interface PrivacySettings {
  posts: 'everyone' | 'friends' | 'nobody';
  messages: 'everyone' | 'friends' | 'nobody';
  phone: 'everyone' | 'friends' | 'nobody';
  onlineStatus: 'everyone' | 'friends' | 'nobody';
  stories: 'everyone' | 'friends' | 'custom';
}

export interface LinkPreviewData {
  url: string;
  title: string;
  description: string;
  image: string;
  domain: string;
}

export interface TextOverlayData {
  text: string;
  color?: string;
  bgColor?: string;
  fontSize?: number;
  position?: 'top' | 'center' | 'bottom';
}

export type CallType = 'voice' | 'video';
export type CallStatus = 'ongoing' | 'completed' | 'missed' | 'rejected';
