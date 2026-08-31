import React, { useState } from 'react';
import { CallHistory } from '../components/calls/CallHistory.js';
import { NewCallModal } from '../components/calls/NewCallModal.js';
import { PhoneCall, Phone } from 'lucide-react';

export const CallsPage: React.FC = () => {
  const [showNewCall, setShowNewCall] = useState(false);

  return (
    <div className="max-w-2xl mx-auto min-w-0 text-[#D9D0B8]">
      <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-[#202A2D] border border-[#3A4B4D] shadow-xs">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2B3940] border border-[#3A4B4D] text-[#71877B]">
          <PhoneCall className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[#D9D0B8]">Call History</h1>
          <p className="text-xs text-[#A8AAA0]">
            Peer-to-peer WebRTC encrypted voice and video call logs.
          </p>
        </div>
        <button
          onClick={() => setShowNewCall(true)}
          className="bg-[#D0A56A] hover:bg-[#E0B779] text-[#171A1C] px-4 py-2 rounded-[10px] text-sm font-semibold flex items-center gap-2 transition-colors shadow-xs"
        >
          <Phone className="h-4 w-4 stroke-[2.5]" />
          New Call
        </button>
      </div>

      <CallHistory />

      <NewCallModal isOpen={showNewCall} onClose={() => setShowNewCall(false)} />
    </div>
  );

};
