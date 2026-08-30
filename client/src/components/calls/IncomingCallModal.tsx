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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 text-center shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up">
        <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
          <Avatar src={caller.avatar_url} fallback={caller.display_name} size="xl" />
        </div>

        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{caller.display_name}</h3>
        <p className="text-xs text-slate-400 mt-0.5">@{caller.username}</p>

        <div className="my-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          {type === 'video' ? <Video className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
          <span className="capitalize">Incoming {type} Call...</span>
        </div>

        {/* Accept / Decline Action Buttons */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <button
            type="button"
            onClick={onReject}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition-transform active:scale-95"
            title="Decline"
          >
            <PhoneOff className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={onAccept}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 animate-bounce"
            title="Accept"
          >
            <Phone className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
