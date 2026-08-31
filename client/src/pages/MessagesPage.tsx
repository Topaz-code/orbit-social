import React, { useState } from 'react';
import { useChat } from '../hooks/useChat.js';
import { ConversationList } from '../components/chat/ConversationList.js';
import { ChatView } from '../components/chat/ChatView.js';
import { Conversation } from '../types/index.js';
import { MessageSquare, ShieldCheck, Lock } from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { conversations, activeConversation, setActiveConversation, isLoadingConversations } =
    useChat();
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    setMobileShowChat(true);
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] rounded-3xl border border-[#3A4B4D] bg-[#202A2D] shadow-xs overflow-hidden flex text-[#D9D0B8]">
      {/* Left Column: Conversation Sidebar */}
      <div
        className={`w-full lg:w-80 flex-shrink-0 h-full ${
          mobileShowChat ? 'hidden lg:block' : 'block'
        }`}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeConversation?.id || null}
          onSelect={handleSelectConversation}
          isLoading={isLoadingConversations}
        />
      </div>

      {/* Right Column: Chat Window or Placeholder */}
      <div
        className={`flex-1 h-full min-w-0 ${
          mobileShowChat ? 'block' : 'hidden lg:flex flex-col'
        }`}
      >
        {activeConversation ? (
          <ChatView
            conversation={activeConversation}
            onBack={() => setMobileShowChat(false)}
          />
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center h-full p-8 text-center bg-[#171A1C]">
            <div className="h-16 w-16 rounded-3xl bg-[#2B3940] border border-[#3A4B4D] flex items-center justify-center text-[#D0A56A] mb-4 shadow-xs">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-[#D9D0B8]">
              Private Real-Time Messaging
            </h3>
            <p className="max-w-sm text-xs text-[#A8AAA0] mt-1 mb-6 leading-relaxed">
              Select a conversation from the sidebar or click + to start messaging directly with friends over MQTT.
            </p>

            <div className="flex items-center gap-4 text-xs font-semibold text-[#A8AAA0]">
              <span className="flex items-center gap-1.5 bg-[#202A2D] px-3 py-1.5 rounded-full border border-[#3A4B4D]">
                <ShieldCheck className="h-4 w-4 text-[#71877B]" /> TLS Encrypted
              </span>
              <span className="flex items-center gap-1.5 bg-[#202A2D] px-3 py-1.5 rounded-full border border-[#3A4B4D]">
                <Lock className="h-4 w-4 text-[#496D6B]" /> Zero Telemetry
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

};
