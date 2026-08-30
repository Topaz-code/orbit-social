import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { CallRecord } from '../../types/index.js';
import { Avatar } from '../ui/avatar.js';
import { Button } from '../ui/button.js';
import { formatRelativeTime, formatCallDuration } from '../../lib/utils.js';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { useCall } from '../../hooks/useCall.js';

export const CallHistory: React.FC = () => {
  const { startCall } = useCall();

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ['calls', 'history'],
    queryFn: async () => {
      const res = await api.get('/calls/history');
      return (res.data?.data || []) as CallRecord[];
    },
  });

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="py-6 text-center text-xs text-slate-400">Loading call history...</div>
      ) : calls.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          No past calls. Tap the call icon in any profile or chat to start a call!
        </div>
      ) : (
        calls.map((call) => {
          const isMissed = call.status === 'missed' || call.status === 'rejected';

          return (
            <div
              key={call.id}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={call.other_user.avatar_url}
                  fallback={call.other_user.display_name}
                  size="md"
                />

                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {call.other_user.display_name}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                    {isMissed ? (
                      <PhoneMissed className="h-3.5 w-3.5 text-rose-500" />
                    ) : call.is_outgoing ? (
                      <PhoneOutgoing className="h-3.5 w-3.5 text-indigo-500" />
                    ) : (
                      <PhoneIncoming className="h-3.5 w-3.5 text-emerald-500" />
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
                >
                  <Phone className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => startCall(call.other_user, 'video')}
                  title="Video Call"
                >
                  <Video className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </Button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
