import React, { useState } from 'react';
import { X, Phone, Video, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { useCall } from '../../hooks/useCall.js';
import type { User } from '../../types/index.js';

interface NewCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewCallModal: React.FC<NewCallModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const { startCall } = useCall();

  const { data: friends = [], isLoading } = useQuery<User[]>({
    queryKey: ['friends-list'],
    queryFn: () => api.get('/friends').then((r) => r.data.data),
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const filtered = friends.filter(
    (f) =>
      f.display_name.toLowerCase().includes(search.toLowerCase()) ||
      f.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleCall = async (
    friend: User,
    type: 'voice' | 'video'
  ) => {
    await startCall(
      {
        id: friend.id,
        username: friend.username,
        display_name: friend.display_name,
        avatar_url: friend.avatar_url ?? '',
      },
      type
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-[#202A2D] border border-[#3A4B4D] p-6 shadow-2xl text-[#D9D0B8]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#D9D0B8]">New Call</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#7F8B86] transition-colors hover:bg-[#2B3940] hover:text-[#D9D0B8]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7F8B86]" />
          <input
            type="text"
            placeholder="Search friends..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-[10px] border border-[#3A4B4D] bg-[#2B3940] py-2 pl-9 pr-4 text-sm text-[#D9D0B8] placeholder-[#7F8B86] outline-none focus:ring-2 focus:ring-[#496D6B]"
          />
        </div>

        {/* Friends list */}
        <div className="max-h-80 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex animate-pulse items-center gap-3 rounded-xl p-2 bg-[#2B3940]/50">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-[#2B3940]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded bg-[#2B3940]" />
                    <div className="h-2.5 w-20 rounded bg-[#2B3940]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#A8AAA0]">
              {search ? 'No friends match your search.' : 'No friends yet.'}
            </div>
          ) : (
            <ul className="space-y-1">
              {filtered.map((friend) => (
                <li
                  key={friend.id}
                  className="flex items-center gap-3 rounded-[10px] p-2 transition-colors hover:bg-[#2B3940]"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2B3940] border border-[#3A4B4D] text-sm font-bold uppercase text-[#D9D0B8]">
                      {friend.display_name.charAt(0)}
                    </div>
                    {friend.is_online && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#202A2D] bg-[#71877B]" />
                    )}
                  </div>

                  {/* Name / username */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#D9D0B8]">
                      {friend.display_name}
                    </p>
                    <p className="truncate text-xs text-[#A8AAA0]">@{friend.username}</p>
                  </div>

                  {/* Call buttons */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => handleCall(friend, 'voice')}
                      title="Voice call"
                      className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[#71877B] transition-colors hover:bg-[#2B3940] hover:text-[#82998C]"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleCall(friend, 'video')}
                      title="Video call"
                      className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[#496D6B] transition-colors hover:bg-[#2B3940] hover:text-[#5A7D78]"
                    >
                      <Video className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

