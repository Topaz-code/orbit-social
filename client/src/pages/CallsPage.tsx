import React from 'react';
import { CallHistory } from '../components/calls/CallHistory.js';
import { PhoneCall } from 'lucide-react';

export const CallsPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto min-w-0">
      <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
          <PhoneCall className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">Call History</h1>
          <p className="text-xs text-slate-400">
            Peer-to-peer WebRTC encrypted voice and video call logs.
          </p>
        </div>
      </div>

      <CallHistory />
    </div>
  );
};
