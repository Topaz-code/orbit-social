import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { useChat } from '../../hooks/useChat.js';
import { useAuthStore } from '../../stores/authStore.js';
import { User } from '../../types/index.js';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog.js';
import { Input } from '../ui/input.js';
import { Avatar } from '../ui/avatar.js';
import { Button } from '../ui/button.js';
import { Search, UserPlus, Users, Check } from 'lucide-react';

interface NewConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useAuthStore();
  const { startConversation, refetchConversations } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['user-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) {
        const friendsRes = await api.get(`/users/${user?.id}/friends`);
        return (friendsRes.data?.data || []) as User[];
      }
      const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}&type=people`);
      return (res.data?.data?.people || []) as User[];
    },
    enabled: open,
  });

  const toggleSelectUser = (userId: string) => {
    setErrorMessage(null);
    if (mode === 'direct') {
      handleStartDirect(userId);
    } else {
      if (selectedUserIds.includes(userId)) {
        setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
      } else {
        if (selectedUserIds.length >= 9) {
          setErrorMessage('Groups can have at most 10 members.');
          return;
        }
        setSelectedUserIds((prev) => [...prev, userId]);
      }
    }
  };

  const handleStartDirect = async (targetId: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await startConversation(targetId);
      onOpenChange(false);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Could not start chat. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGroupChat = async () => {
    if (!groupName.trim() || selectedUserIds.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await api.post('/conversations', {
        type: 'group',
        name: groupName.trim(),
        participant_ids: selectedUserIds,
      });
      await refetchConversations();
      setErrorMessage(null);
      onOpenChange(false);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Could not create group chat. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-md">
      <DialogHeader>
        <DialogTitle>New Conversation</DialogTitle>
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => setMode('direct')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              mode === 'direct'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Direct Message
          </button>
          <button
            type="button"
            onClick={() => setMode('group')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              mode === 'group'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Users className="h-3 w-3" /> Group Chat (Max 10)
          </button>
        </div>
      </DialogHeader>

      <div className="space-y-4">
        {mode === 'group' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Group Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Weekend Crew"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Search Users by Name, Username or Phone
          </label>
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        {/* User Search Results List */}
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
          {isLoading ? (
            <div className="py-4 text-center text-xs text-slate-400">Searching users...</div>
          ) : searchResults.filter((u) => u.id !== user?.id).length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">No users found</div>
          ) : (
            searchResults
              .filter((u) => u.id !== user?.id)
              .map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleSelectUser(u.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-500/40'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar_url} fallback={u.display_name} size="sm" isOnline={u.is_online} showStatus />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {u.display_name}
                        </p>
                        <p className="text-[11px] text-slate-400">@{u.username}</p>
                      </div>
                    </div>

                    {mode === 'group' ? (
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    ) : (
                      <UserPlus className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>

      {mode === 'group' && (
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroupChat}
            isLoading={isSubmitting}
            disabled={!groupName.trim() || selectedUserIds.length === 0}
          >
            Create Group ({selectedUserIds.length + 1}/10)
          </Button>
        </DialogFooter>
      )}
    </Dialog>
  );
};
