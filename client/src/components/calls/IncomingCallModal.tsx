import React, { useEffect } from 'react';
import { Avatar } from '../ui/avatar.js';
import { Phone, PhoneOff, Video } from 'lucide-react';

interface IncomingCallModalProps {
  caller: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  type: 'voice' | 'video';
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  caller,
  type,
  onAccept,
  onReject,
}) => {
  // Play subtle incoming ringtone audio oscillator or beep
  useEffect(() => {
    let ctx: AudioContext | null = null;
    let osc: OscillatorNode | null = null;
    let gain: GainNode | null = null;

    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = () => {
        if (!ctx) return;
        osc = ctx.createOscillator();
        gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setTimeout(() => {
          try {
            osc?.stop();
          } catch {}
        }, 1200);
      };

      playTone();
      const interval = setInterval(playTone, 3000);

      return () => {
        clearInterval(interval);
        try {
          ctx?.close();
        } catch {}
      };
    } catch {
      // Ignored if audio blocked
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in select-none">
      <div className="w-full max-w-sm rounded-3xl bg-[#202A2D] p-6 text-center shadow-2xl border border-[#3A4B4D] animate-slide-up text-[#D9D0B8]">
        <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-[#D0A56A]/20 animate-ping" />
          <Avatar src={caller.avatar_url} fallback={caller.display_name} size="xl" />
        </div>

        <h3 className="text-xl font-bold text-[#D9D0B8]">{caller.display_name}</h3>
        <p className="text-xs text-[#A8AAA0] mt-0.5">@{caller.username}</p>

        <div className="my-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2B3940] border border-[#3A4B4D] text-xs font-semibold text-[#D0A56A]">
          {type === 'video' ? <Video className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
          <span className="capitalize">Incoming {type} Call...</span>
        </div>

        {/* Accept / Decline Action Buttons */}
        <div className="flex items-center justify-center gap-8 mt-6">
          {/* Decline */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={onReject}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#B87568] text-[#171A1C] hover:bg-[#C98679] shadow-lg transition-transform active:scale-95 border border-[#B87568]"
              title="Decline"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
            <span className="text-xs font-medium text-[#D9D0B8]">Decline</span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={onAccept}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#71877B] text-[#171A1C] hover:bg-[#82998C] shadow-lg transition-transform active:scale-95 animate-bounce border border-[#71877B]"
              title="Accept"
            >
              {type === 'video' ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
            </button>
            <span className="text-xs font-medium text-[#D9D0B8]">Accept</span>
          </div>
        </div>
      </div>
    </div>


  );
};
