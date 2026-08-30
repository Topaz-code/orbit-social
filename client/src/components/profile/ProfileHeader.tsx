import React, { useState } from 'react';
import { User } from '../../types/index.js';
import { Avatar } from '../ui/avatar.js';
import { Button } from '../ui/button.js';
import {
  Camera,
  Calendar,
  Users,
  FileText,
  MessageCircle,
  Phone,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
} from 'lucide-react';
import { formatRelativeTime, getMediaUrl } from '../../lib/utils.js';
import { useChat } from '../../hooks/useChat.js';
import { useCall } from '../../hooks/useCall.js';
import { useNavigate } from 'react-router-dom';

interface ProfileHeaderProps {
  user: User;
  isSelf: boolean;
  onOpenEdit?: () => void;
  onSendFriendRequest?: () => void;
  onAcceptFriendRequest?: () => void;
  onRemoveFriend?: () => void;
  friendshipStatus?: string;
  onUpdateAvatar?: () => void;
  onUpdateCover?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  isSelf,
  onOpenEdit,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onRemoveFriend,
  friendshipStatus,
  onUpdateAvatar,
  onUpdateCover,
}) => {
  const navigate = useNavigate();
  const { startConversation } = useChat();
  const { startCall } = useCall();

  const handleStartDirectChat = async () => {
    const conv = await startConversation(user.id);
    if (conv) navigate('/messages');
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden shadow-xs mb-6">
      {/* Cover Image Banner */}
      <div className="relative h-48 sm:h-64 w-full bg-slate-900 overflow-hidden group">
        <img
          src={
            getMediaUrl(user.cover_url) ||
            'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80'
          }
          alt="Cover"
          className="h-full w-full object-cover"
        />
        {isSelf && onUpdateCover && (
          <button
            type="button"
            onClick={onUpdateCover}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md transition-all shadow-md"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Change Cover</span>
          </button>
        )}
      </div>

      {/* Profile Bar */}
      <div className="px-4 sm:px-8 pb-6 pt-0 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
          {/* Avatar Container */}
          <div className="relative group">
            <div className="rounded-full ring-4 ring-white dark:ring-slate-900 shadow-xl overflow-hidden bg-white dark:bg-slate-900">
              <Avatar
                src={user.avatar_url}
                fallback={user.display_name}
                size="xl"
                isOnline={user.is_online}
                showStatus={true}
              />
            </div>

            {/* Change Avatar Button (Self Only) */}
            {isSelf && (
              <button
                onClick={onUpdateAvatar}
                className="absolute bottom-1 right-1 p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-transform hover:scale-105"
                title="Change Profile Photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {isSelf ? (
              <Button onClick={onOpenEdit} variant="outline" size="sm">
                Edit Profile
              </Button>
            ) : (
              <>
                {friendshipStatus === 'friends' ? (
                  <Button variant="secondary" size="sm" onClick={onRemoveFriend}>
                    <UserCheck className="h-4 w-4 mr-1.5 text-emerald-500" />
                    <span>Friends</span>
                  </Button>
                ) : friendshipStatus === 'pending_sent' ? (
                  <Button variant="secondary" size="sm" disabled>
                    Request Sent
                  </Button>
                ) : friendshipStatus === 'pending_received' ? (
                  <Button size="sm" onClick={onAcceptFriendRequest} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <UserCheck className="h-4 w-4 mr-1.5" />
                    <span>Accept Request</span>
                  </Button>
                ) : (
                  <Button size="sm" onClick={onSendFriendRequest}>
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    <span>Add Friend</span>
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={handleStartDirectChat}>
                  <MessageCircle className="h-4 w-4 mr-1.5 text-indigo-500" />
                  <span>Message</span>
                </Button>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    startCall(
                      {
                        id: user.id,
                        username: user.username,
                        display_name: user.display_name,
                        avatar_url: user.avatar_url || '',
                      },
                      'voice'
                    )
                  }
                  title="Voice Call"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* User Bio and Meta Stats */}
        <div className="space-y-2">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {user.display_name}
            </h1>
            <p className="text-sm text-slate-400 font-medium">@{user.username}</p>
          </div>

          {user.bio && (
            <p className="text-sm text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed whitespace-pre-line">
              {user.bio}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-indigo-500" />
              <strong className="text-slate-900 dark:text-slate-100">
                {user.friend_count || 0}
              </strong>{' '}
              Friends
            </span>

            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-purple-500" />
              <strong className="text-slate-900 dark:text-slate-100">
                {user.post_count || 0}
              </strong>{' '}
              Posts
            </span>

            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              Joined {formatRelativeTime(user.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
