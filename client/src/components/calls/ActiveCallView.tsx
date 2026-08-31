import React, { useEffect, useRef } from 'react';
import { useCallStore } from '../../stores/callStore.js';
import { useCall } from '../../hooks/useCall.js';
import { Avatar } from '../ui/avatar.js';
import { formatCallDuration } from '../../lib/utils.js';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Minimize2,
  Maximize2,
} from 'lucide-react';

export const ActiveCallView: React.FC = () => {
  const {
    activeCall,
    localStream,
    remoteStream,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
  } = useCallStore();
  const { endCall } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Attach local stream to preview
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Ultra-low-latency remote audio playback via Web Audio API
  useEffect(() => {
    if (!remoteStream) return;

    let ctx: AudioContext | null = null;
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'interactive',
      });
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const source = ctx.createMediaStreamSource(remoteStream);
      audioSourceRef.current = source;
      source.connect(ctx.destination);
    } catch (e) {
      console.warn('[Call] Web Audio direct routing fallback to HTML5 audio:', e);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(() => {});
      }
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }

    return () => {
      try {
        audioSourceRef.current?.disconnect();
        audioSourceRef.current = null;
        if (ctx && ctx.state !== 'closed') {
          ctx.close().catch(() => {});
        }
      } catch {}
    };
  }, [remoteStream]);

  // Outgoing ringing dial tone
  useEffect(() => {
    if (!activeCall || activeCall.status !== 'ringing' || !activeCall.isCaller) return;

    let ctx: AudioContext | null = null;
    let osc: OscillatorNode | null = null;
    let gain: GainNode | null = null;
    let interval: any = null;

    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playDialTone = () => {
        if (!ctx || ctx.state === 'closed') return;
        osc = ctx.createOscillator();
        gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(425, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setTimeout(() => {
          try {
            osc?.stop();
          } catch {}
        }, 1000);
      };

      playDialTone();
      interval = setInterval(playDialTone, 3000);
    } catch {}

    return () => {
      if (interval) clearInterval(interval);
      try {
        osc?.stop();
        ctx?.close().catch(() => {});
      } catch {}
    };
  }, [activeCall?.status, activeCall?.isCaller]);



  if (!activeCall) return null;

  const isVideoCall = activeCall.type === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full h-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden bg-[#202A2D] border border-[#3A4B4D] shadow-2xl flex flex-col justify-between p-6 m-4 text-[#D9D0B8]">
        {/* Call Header */}
        <div className="flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <Avatar
              src={activeCall.remoteUser.avatar_url}
              fallback={activeCall.remoteUser.display_name}
              size="md"
            />
            <div>
              <h3 className="text-base font-bold text-[#D9D0B8] leading-tight">
                {activeCall.remoteUser.display_name}
              </h3>
              <p className="text-xs text-[#D0A56A] font-mono">
                {activeCall.status === 'ringing'
                  ? 'Ringing...'
                  : formatCallDuration(activeCall.duration)}
              </p>
            </div>
          </div>
        </div>

        {/* Video / Audio Center Stage */}
        <div className="relative flex-1 my-4 rounded-2xl overflow-hidden bg-[#171A1C] border border-[#3A4B4D] flex items-center justify-center">
          {isVideoCall ? (
            <>
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />

              {!remoteStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <Avatar
                    src={activeCall.remoteUser.avatar_url}
                    fallback={activeCall.remoteUser.display_name}
                    size="xl"
                    className="mb-4"
                  />
                  <p className="text-sm font-semibold text-[#D9D0B8]">Connecting video stream...</p>
                </div>
              )}

              {/* Local PiP (Picture-in-Picture) */}
              <div className="absolute top-4 right-4 h-36 w-28 sm:h-44 sm:w-36 rounded-2xl overflow-hidden border-2 border-[#3A4B4D] shadow-2xl bg-[#171A1C] z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover mirror"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {activeCall.isVideoOff && (
                  <div className="absolute inset-0 bg-[#202A2D] flex items-center justify-center text-xs text-[#A8AAA0]">
                    Camera off
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Voice Call Center Avatar Stage */
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <span className="absolute inset-0 rounded-full bg-[#D0A56A]/20 animate-ping" />
                <Avatar
                  src={activeCall.remoteUser.avatar_url}
                  fallback={activeCall.remoteUser.display_name}
                  size="xl"
                  className="h-32 w-32"
                />
              </div>
              <h2 className="text-2xl font-bold text-[#D9D0B8]">{activeCall.remoteUser.display_name}</h2>
              <p className="text-sm text-[#A8AAA0] mt-1">
                {activeCall.status === 'ringing' ? 'Calling...' : 'Voice Call Active'}
              </p>
              {/* Fallback audio element for remote audio track */}
              <audio ref={remoteAudioRef} autoPlay playsInline />
            </div>

          )}
        </div>

        {/* Bottom Control Actions Bar */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 z-20 py-2">
          {/* Mute toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-all border border-[#3A4B4D] ${
              activeCall.isMuted
                ? 'bg-[#B87568] text-[#171A1C]'
                : 'bg-[#2B3940] hover:bg-[#314048] text-[#D9D0B8]'
            }`}
            title={activeCall.isMuted ? 'Unmute' : 'Mute'}
          >
            {activeCall.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Video Toggle (if video call) */}
          {isVideoCall && (
            <button
              type="button"
              onClick={toggleVideo}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all border border-[#3A4B4D] ${
                activeCall.isVideoOff
                  ? 'bg-[#B87568] text-[#171A1C]'
                  : 'bg-[#2B3940] hover:bg-[#314048] text-[#D9D0B8]'
              }`}
              title={activeCall.isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {activeCall.isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>
          )}

          {/* Speaker Toggle */}
          <button
            type="button"
            onClick={toggleSpeaker}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2B3940] hover:bg-[#314048] text-[#D9D0B8] border border-[#3A4B4D] transition-all"
            title="Speaker"
          >
            {activeCall.isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={endCall}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#B87568] hover:bg-[#C98679] text-[#171A1C] shadow-xl transition-transform active:scale-95 ml-2"
            title="End Call"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

