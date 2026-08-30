import React, { useState } from 'react';
import { CallHistory } from '../components/calls/CallHistory.js';
import { NewCallModal } from '../components/calls/NewCallModal.js';
import { PhoneCall, Phone } from 'lucide-react';

export const CallsPage: React.FC = () => {
  const [showNewCall, setShowNewCall] = useState(false);

  return (
    <div className="max-w-2xl mx-auto min-w-0">
      <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
          <PhoneCall className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">Call History</h1>
          <p className="text-xs text-slate-400">
            Peer-to-peer WebRTC encrypted voice and video call logs.
          </p>
        </div>
        <button
          onClick={() => setShowNewCall(true)}
          className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Phone className="h-4 w-4" />
          New Call
        </button>
      </div>

      <CallHistory />

      <NewCallModal isOpen={showNewCall} onClose={() => setShowNewCall(false)} />
    </div>
  );
};
