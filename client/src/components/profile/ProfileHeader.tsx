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
  Flag,
} from 'lucide-react';
import { formatRelativeTime, getMediaUrl } from '../../lib/utils.js';
import { useChat } from '../../hooks/useChat.js';
import { useCall } from '../../hooks/useCall.js';
import { useNavigate } from 'react-router-dom';
import { ReportDialog } from '../shared/ReportDialog.js';

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
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleStartDirectChat = async () => {
    const conv = await startConversation(user.id);
    if (conv) navigate('/messages');
  };

  return (
    <div className="rounded-3xl border border-[#3A4B4D] bg-[#202A2D] overflow-hidden shadow-xs mb-6 text-[#D9D0B8]">
      {/* Cover Image Banner */}
      <div className="relative h-48 sm:h-64 w-full bg-[#171A1C] overflow-hidden group">
        <img
          src={
            getMediaUrl(user.cover_url) ||
            'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80'
          }
          alt="Cover"
          className="h-full w-full object-cover opacity-90"
        />
        {isSelf && onUpdateCover && (
          <button
            type="button"
            onClick={onUpdateCover}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-black/70 hover:bg-black/90 text-[#D9D0B8] text-xs font-semibold backdrop-blur-md transition-all shadow-xs border border-[#3A4B4D]"
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
            <div className="rounded-full ring-4 ring-[#202A2D] shadow-xl overflow-hidden bg-[#202A2D]">
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
                className="absolute bottom-1 right-1 p-2 rounded-full bg-[#D0A56A] hover:bg-[#E0B779] text-[#171A1C] shadow-lg transition-transform hover:scale-105"
                title="Change Profile Photo"
              >
                <Camera className="h-4 w-4 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {isSelf ? (
              <Button onClick={onOpenEdit} variant="outline" size="sm" className="bg-[#2B3940] border-[#3A4B4D] text-[#D9D0B8] hover:bg-[#314048] rounded-[10px]">
                Edit Profile
              </Button>
            ) : (
              <>
                {friendshipStatus === 'friends' ? (
                  <Button variant="secondary" size="sm" onClick={onRemoveFriend} className="bg-[#71877B]/20 text-[#71877B] border border-[#71877B]/40 rounded-[10px]">
                    <UserCheck className="h-4 w-4 mr-1.5 text-[#71877B]" />
                    <span>Friends</span>
                  </Button>
                ) : friendshipStatus === 'pending_sent' ? (
                  <Button variant="secondary" size="sm" disabled className="bg-[#2B3940] text-[#A8AAA0] border border-[#3A4B4D] rounded-[10px]">
                    Request Sent
                  </Button>
                ) : friendshipStatus === 'pending_received' ? (
                  <Button size="sm" onClick={onAcceptFriendRequest} className="bg-[#71877B] hover:bg-[#82998C] text-[#171A1C] rounded-[10px]">
                    <UserCheck className="h-4 w-4 mr-1.5" />
                    <span>Accept Request</span>
                  </Button>
                ) : (
                  <Button size="sm" onClick={onSendFriendRequest} className="bg-[#D0A56A] hover:bg-[#E0B779] text-[#171A1C] rounded-[10px]">
                    <UserPlus className="h-4 w-4 mr-1.5 stroke-[2.5]" />
                    <span>Add Friend</span>
                  </Button>
                )}

                <Button variant="secondary" size="sm" onClick={handleStartDirectChat} className="bg-[#496D6B] hover:bg-[#5A7D78] text-[#D9D0B8] rounded-[10px]">
                  <MessageCircle className="h-4 w-4 mr-1.5" />
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
                  className="rounded-[10px] text-[#D9D0B8] hover:bg-[#2B3940]"
                >
                  <Phone className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsReportOpen(true)}
                  title="Report User"
                  className="rounded-[10px] text-[#B87568] hover:bg-[#B87568]/20 hover:text-[#C98679]"
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* User Bio and Meta Stats */}
        <div className="space-y-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-[#D9D0B8]">
                {user.display_name}
              </h1>
              {user.is_banned && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#B87568]/20 text-[#B87568] border border-[#B87568]/40">
                  Suspended
                </span>
              )}
              {user.role === 'ADMIN' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#D0A56A]/20 text-[#D0A56A] border border-[#D0A56A]/40">
                  Admin
                </span>
              )}
              {user.role === 'MODERATOR' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#496D6B]/20 text-[#71877B] border border-[#496D6B]/40">
                  Moderator
                </span>
              )}
            </div>
            <p className="text-sm text-[#A8AAA0] font-medium">@{user.username}</p>
          </div>

          {user.bio && (
            <p className="text-sm font-serif text-[#D9D0B8] max-w-2xl leading-relaxed whitespace-pre-line">
              {user.bio}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 text-xs text-[#A8AAA0] border-t border-[#3A4B4D]">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[#496D6B]" />
              <strong className="text-[#D9D0B8]">
                {user.friend_count || 0}
              </strong>{' '}
              Friends
            </span>

            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-[#D0A56A]" />
              <strong className="text-[#D9D0B8]">
                {user.post_count || 0}
              </strong>{' '}
              Posts
            </span>

            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#7F8B86]" />
              Joined {formatRelativeTime(user.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Report User Dialog */}
      {!isSelf && (
        <ReportDialog
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          reportedType="USER"
          reportedId={user.id}
          targetTitle={`Report @${user.username}`}
        />
      )}
    </div>
  );
};
