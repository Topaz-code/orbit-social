import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { CallRecord } from '../../types/index.js';
import { Avatar } from '../ui/avatar.js';
import { Button } from '../ui/button.js';
import { formatRelativeTime, formatCallDuration } from '../../lib/utils.js';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Trash2 } from 'lucide-react';
import { SolidStartCallIcon, SolidVideoIcon } from './CallIcons.js';
import { useCall } from '../../hooks/useCall.js';

import { useDialogStore, confirmAction } from '../../stores/dialogStore.js';

export const CallHistory: React.FC = () => {
  const { startCall } = useCall();
  const queryClient = useQueryClient();
  const { toast } = useDialogStore();

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ['calls', 'history'],
    queryFn: async () => {
      const res = await api.get('/calls/history');
      return (res.data?.data || []) as CallRecord[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (callId: string) => api.delete(`/calls/${callId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls', 'history'] });
      toast.success('Call log deleted');
    },
    onError: () => {
      toast.error('Failed to delete call log');
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => api.delete('/calls/history/clear'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls', 'history'] });
      toast.success('Call history cleared');
    },
    onError: () => {
      toast.error('Failed to clear call history');
    },
  });

  const handleDelete = async (e: React.MouseEvent, callId: string) => {
    e.stopPropagation();
    deleteMutation.mutate(callId);
  };

  const handleClearAll = async () => {
    const ok = await confirmAction({
      title: 'Clear Call History',
      message: 'Are you sure you want to clear your entire call history? This action cannot be undone.',
      confirmText: 'Clear All',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (ok) {
      clearAllMutation.mutate();
    }
  };


  return (
    <div className="space-y-3 text-[#D9D0B8]">
      {calls.length > 0 && (
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-xs text-[#A8AAA0]">
            {calls.length} {calls.length === 1 ? 'call' : 'calls'} recorded
          </span>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={clearAllMutation.isPending}
            className="text-xs font-semibold text-[#B87568] hover:text-[#C98679] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear All
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-xs text-[#7F8B86]">Loading call history...</div>
      ) : calls.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#A8AAA0] rounded-2xl bg-[#202A2D]/50 border border-[#3A4B4D]/50 p-6">
          No past calls. Tap the call icon in any profile or chat to start a call!
        </div>
      ) : (
        calls.map((call) => {
          const isMissed = call.status === 'missed' || call.status === 'rejected';

          return (
            <div
              key={call.id}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-[#3A4B4D] bg-[#202A2D] shadow-xs hover:border-[#496D6B]/50 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={call.other_user.avatar_url}
                  fallback={call.other_user.display_name}
                  size="md"
                />

                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#D9D0B8] truncate">
                    {call.other_user.display_name}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-[#A8AAA0] mt-0.5">
                    {isMissed ? (
                      <PhoneMissed className="h-3.5 w-3.5 text-[#B87568]" />
                    ) : call.is_outgoing ? (
                      <PhoneOutgoing className="h-3.5 w-3.5 text-[#496D6B]" />
                    ) : (
                      <PhoneIncoming className="h-3.5 w-3.5 text-[#71877B]" />
                    )}

                    <span className="capitalize">
                      {isMissed ? 'Missed' : call.is_outgoing ? 'Outgoing' : 'Incoming'}{' '}
                      {call.type} call
                    </span>

                    {call.duration > 0 && <span>({formatCallDuration(call.duration)})</span>}

                    <span>• {formatRelativeTime(call.started_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => startCall(call.other_user, 'voice')}
                  title="Voice Call"
                  className="rounded-[10px] text-[#71877B] hover:bg-[#2B3940]"
                >
                  <SolidStartCallIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => startCall(call.other_user, 'video')}
                  title="Video Call"
                  className="rounded-[10px] text-[#496D6B] hover:bg-[#2B3940]"
                >
                  <SolidVideoIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => handleDelete(e, call.id)}
                  title="Delete call log"
                  className="rounded-[10px] text-[#7F8B86] hover:text-[#B87568] hover:bg-[#2B3940] transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

