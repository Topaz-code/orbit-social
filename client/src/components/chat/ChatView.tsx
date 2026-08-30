import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from '../../types/index.js';
import { useChat } from '../../hooks/useChat.js';
import { useCall } from '../../hooks/useCall.js';
import { useAuthStore } from '../../stores/authStore.js';
import { Avatar } from '../ui/avatar.js';
import { MessageBubble } from './MessageBubble.js';
import { ChatInput } from './ChatInput.js';
import { TypingIndicator } from './TypingIndicator.js';
import { Phone, Video, Users, ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api.js';

interface ChatViewProps {
  conversation: Conversation;
  onBack?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ conversation, onBack }) => {
  const { user } = useAuthStore();
  const { messages, typingUsers, sendMessage, emitTyping, isSending } = useChat();
  const { startCall } = useCall();

  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingUsers.length]);

  const handleDeleteMessage = async (messageId: string, forEveryone = false) => {
    try {
      await api.delete(`/messages/${messageId}?forEveryone=${forEveryone}`);
    } catch (err) {
      console.error('Delete message error:', err);
    }
  };

  const handleStartCall = (type: 'voice' | 'video') => {
    if (conversation.type === 'direct' && conversation.other_user) {
      startCall(conversation.other_user, type, conversation.id);
    } else {
      alert('Group audio/video calls are available in direct chats');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/40">
      {/* Chat Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <Avatar
            src={conversation.avatar_url}
            fallback={conversation.name}
            isOnline={conversation.type === 'direct' ? conversation.other_user?.is_online : false}
            showStatus={conversation.type === 'direct'}
            size="md"
          />

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {conversation.name}
            </h3>
            <p className="text-[11px] text-slate-400">
              {conversation.type === 'direct'
                ? conversation.other_user?.is_online
                  ? 'Active now'
                  : 'Offline'
                : `${conversation.members?.length || 0} members`}
            </p>
          </div>
        </div>

        {/* Action Icons: Voice & Video Call */}
        {conversation.type === 'direct' && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleStartCall('voice')}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
              title="Voice Call"
            >
              <Phone className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleStartCall('video')}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
              title="Video Call"
            >
              <Video className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-xs text-slate-400">
            <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500 mb-2">
              🪐
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">End-to-End Chat</p>
            <p className="max-w-xs mt-1">
              Messages are sent directly over local MQTT real-time broker with no tracking.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onReply={(m) => setReplyingMessage(m)}
              onDelete={handleDeleteMessage}
            />
          ))
        )}

        {/* Live Typing Status */}
        {typingUsers.length > 0 && (
          <TypingIndicator
            username={typingUsers.map((u) => u.username).join(', ')}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <ChatInput
        onSendMessage={sendMessage}
        onTyping={emitTyping}
        replyingToMessage={replyingMessage}
        onCancelReply={() => setReplyingMessage(null)}
        disabled={isSending}
      />
    </div>
  );
};
