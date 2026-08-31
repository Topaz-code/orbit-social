import React, { useState } from 'react';
import { Conversation } from '../../types/index.js';
import { Avatar } from '../ui/avatar.js';
import { formatChatTime, cn } from '../../lib/utils.js';
import { Search, Plus, Users } from 'lucide-react';
import { NewConversationModal } from './NewConversationModal.js';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (conv: Conversation) => void;
  isLoading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelect,
  isLoading,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full border-r border-[#3A4B4D] bg-[#202A2D] text-[#D9D0B8]">

      {/* Search and New Chat Header */}
      <div className="p-4 border-b border-[#3A4B4D] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#D9D0B8] tracking-tight">
            Messages
          </h2>
          <button
            type="button"
            onClick={() => setIsNewChatOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#D0A56A] text-[#171A1C] hover:bg-[#E0B779] transition-colors shadow-xs"
            title="New Conversation"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7F8B86]" />
          <input
            type="text"
            placeholder="Search chats..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full h-9 rounded-[10px] border border-[#3A4B4D] bg-[#2B3940] pl-9 pr-3 text-xs text-[#D9D0B8] placeholder:text-[#7F8B86] focus:outline-none focus:ring-2 focus:ring-[#496D6B]"
          />
        </div>
      </div>

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#3A4B4D]/50">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-[#7F8B86]">Loading chats...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#7F8B86]">
            {filterQuery ? 'No chats found' : 'No conversations yet. Start chatting with someone!'}
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = conv.id === activeId;
            const isOnline = conv.type === 'direct' ? conv.other_user?.is_online : false;

            const previewText = conv.last_message
              ? conv.last_message.media_type === 'image'
                ? 'Photo'
                : conv.last_message.media_type === 'video'
                ? 'Video'
                : conv.last_message.media_type === 'voice'
                ? 'Voice note'
                : conv.last_message.media_type === 'file'
                ? 'Attachment'
                : conv.last_message.content || 'New conversation'
              : 'Start the conversation!';

            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={cn(
                  'flex items-center gap-3 p-3.5 cursor-pointer transition-all hover:bg-[#2B3940]',
                  isActive && 'bg-[#496D6B]/25 border-l-4 border-[#D0A56A]'
                )}
              >
                <div className="relative">
                  <Avatar
                    src={conv.avatar_url}
                    fallback={conv.name}
                    isOnline={isOnline}
                    showStatus={conv.type === 'direct'}
                    size="md"
                  />
                  {conv.type === 'group' && (
                    <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#496D6B] text-[#D9D0B8] ring-1 ring-[#171A1C]">
                      <Users className="h-2.5 w-2.5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4
                      className={cn(
                        'text-xs truncate text-[#D9D0B8]',
                        conv.unread_count > 0 ? 'font-bold' : 'font-semibold'
                      )}
                    >
                      {conv.name}
                    </h4>
                    {conv.last_message && (
                      <span className="text-[10px] text-[#A8AAA0] flex-shrink-0 ml-1">
                        {formatChatTime(conv.last_message.created_at)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        'text-[11px] truncate',
                        conv.unread_count > 0
                          ? 'text-[#D9D0B8] font-semibold'
                          : 'text-[#A8AAA0]'
                      )}
                    >
                      {previewText}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D0A56A] px-1 text-[10px] font-bold text-[#171A1C] shadow-xs flex-shrink-0 ml-1">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>


      <NewConversationModal open={isNewChatOpen} onOpenChange={setIsNewChatOpen} />
    </div>
  );
};
