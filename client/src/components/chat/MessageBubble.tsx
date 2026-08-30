import React, { useState } from 'react';
import { Message } from '../../types/index.js';
import { useAuthStore } from '../../stores/authStore.js';
import { formatChatTime, getMediaUrl } from '../../lib/utils.js';
import { Check, CheckCheck, Reply, Trash2, MoreVertical, FileText, Play, Pause } from 'lucide-react';
import { DropdownMenu, DropdownItem } from '../ui/dropdown-menu.js';

interface MessageBubbleProps {
  message: Message;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string, forEveryone?: boolean) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onReply,
  onDelete,
}) => {
  const { user } = useAuthStore();
  const isMine = user?.id === message.sender_id;
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  return (
    <div
      className={`flex flex-col mb-3 group relative z-10 hover:z-30 ${
        isMine ? 'items-end' : 'items-start'
      } animate-fade-in`}
    >
      {/* Sender Name in Group Chat */}
      {!isMine && (
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-3 mb-1">
          {message.sender.display_name}
        </span>
      )}

      <div
        className={`relative flex items-end gap-1.5 max-w-[85%] sm:max-w-[70%] ${
          isMine ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Main Bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 shadow-xs text-sm break-words ${
            isMine
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-xs'
              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs'
          }`}
        >
          {/* Replied Message Preview */}
          {message.reply_to && (
            <div
              className={`mb-2 rounded-xl p-2 text-xs border-l-3 ${
                isMine
                  ? 'bg-black/20 border-white/80 text-white/90'
                  : 'bg-slate-100 dark:bg-slate-900 border-indigo-500 text-slate-700 dark:text-slate-300'
              }`}
            >
              <p className="font-bold text-[11px] leading-tight">
                {message.reply_to.sender.display_name}
              </p>
              <p className="truncate text-[11px] mt-0.5 opacity-90">
                {message.reply_to.content || 'Media attachment'}
              </p>
            </div>
          )}

          {/* Media Content */}
          {message.media_url && (
            <div className="mb-2 overflow-hidden rounded-xl">
              {message.media_type === 'image' && (
                <img
                  src={getMediaUrl(message.media_url)}
                  alt="Attachment"
                  className="max-h-64 w-full object-cover rounded-xl"
                  loading="lazy"
                />
              )}

              {message.media_type === 'video' && (
                <video
                  src={getMediaUrl(message.media_url)}
                  controls
                  className="max-h-64 w-full rounded-xl"
                />
              )}

              {message.media_type === 'voice' && (
                <div className="flex items-center gap-3 py-1 min-w-[200px]">
                  <audio
                    ref={audioRef}
                    src={getMediaUrl(message.media_url)}
                    onEnded={() => setIsPlayingAudio(false)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={toggleAudio}
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isMine ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                  </button>
                  <div className="flex-1">
                    <div className="h-1.5 w-full rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full ${isMine ? 'bg-white' : 'bg-indigo-600'} ${
                          isPlayingAudio ? 'animate-pulse' : ''
                        }`}
                        style={{ width: isPlayingAudio ? '100%' : '30%' }}
                      />
                    </div>
                    <span className="text-[10px] opacity-75 mt-1 block">Voice Note</span>
                  </div>
                </div>
              )}

              {message.media_type === 'file' && (
                <a
                  href={getMediaUrl(message.media_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors"
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-xs underline truncate">Download File</span>
                </a>
              )}
            </div>
          )}

          {/* Text Message */}
          {message.content && (
            <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Timestamp & Read Receipt */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
              isMine ? 'text-indigo-100' : 'text-slate-400'
            }`}
          >
            <span>{formatChatTime(message.created_at)}</span>
            {isMine && (
              <span>
              {message.is_read ? (
                <span title="Read"><CheckCheck className="h-3.5 w-3.5 text-cyan-300" /></span>
              ) : (
                <span title="Sent"><Check className="h-3.5 w-3.5 opacity-70" /></span>
              )}
            </span>
            )}
          </div>
        </div>

        {/* Options / Reply Menu on Hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity relative z-30">
          <DropdownMenu
            align={isMine ? 'right' : 'left'}
            trigger={
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Message options"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            }
          >
            {onReply && (
              <DropdownItem onClick={() => onReply(message)}>
                <Reply className="h-3.5 w-3.5" />
                <span>Reply</span>
              </DropdownItem>
            )}

            {onDelete && isMine && (
              <DropdownItem onClick={() => onDelete(message.id, true)} destructive>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete for everyone</span>
              </DropdownItem>
            )}
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
