import React, { useEffect, useRef, useState } from 'react';
import { useCallStore } from '../../stores/callStore.js';
import { useCall } from '../../hooks/useCall.js';
import { Avatar } from '../ui/avatar.js';
import { formatCallDuration } from '../../lib/utils.js';
import { Volume2, VolumeX } from 'lucide-react';
import {
  ScreencastIcon,
  SolidVideoIcon,
  SolidVideoOffIcon,
  SolidEndCallIcon,
  SolidMicIcon,
  SolidMicOffIcon,
} from './CallIcons.js';


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

  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Attach local stream to preview
  useEffect(() => {
    if (localVideoRef.current && localStream && !isSharingScreen) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isSharingScreen]);

  // Remote audio stream playback
  useEffect(() => {
    if (!remoteStream) return;

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.muted = activeCall ? !activeCall.isSpeakerOn : false;
      const playPromise = remoteAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[Call] Remote audio autoplay waiting for user interaction:', err);
        });
      }
    }

    if (remoteVideoRef.current && (activeCall?.type === 'video' || isSharingScreen)) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream, activeCall?.type, isSharingScreen]);

  // Sync speaker toggle with remote audio playback
  useEffect(() => {
    if (remoteAudioRef.current && activeCall) {
      remoteAudioRef.current.muted = !activeCall.isSpeakerOn;
    }
  }, [activeCall?.isSpeakerOn]);

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

  // Screen share toggle
  const handleToggleScreenShare = async () => {
    if (isSharingScreen) {
      setIsSharingScreen(false);
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        const screenTrack = displayStream.getVideoTracks()[0];
        if (screenTrack && localVideoRef.current) {
          setIsSharingScreen(true);
          localVideoRef.current.srcObject = displayStream;
          screenTrack.onended = () => {
            setIsSharingScreen(false);
            if (localVideoRef.current && localStream) {
              localVideoRef.current.srcObject = localStream;
            }
          };
        }
      } catch (err) {
        console.warn('[ScreenShare] Cancelled or error:', err);
      }
    }
  };

  if (!activeCall) return null;

  const isVideoCall = activeCall.type === 'video' || isSharingScreen;

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

          {/* Speaker quick toggle */}
          <button
            type="button"
            onClick={toggleSpeaker}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2B3940] hover:bg-[#34444c] text-[#D9D0B8] border border-[#3A4B4D] transition-all"
            title="Toggle Speaker"
          >
            {activeCall.isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
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
                  style={{ transform: isSharingScreen ? 'none' : 'scaleX(-1)' }}
                />
                {activeCall.isVideoOff && !isSharingScreen && (
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
            </div>
          )}
        </div>

        {/* Global unmuted remote audio playback track */}
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

        {/* Bottom Control Actions Bar (Flaticon Style & Generous Spacing) */}
        <div className="flex items-center justify-center gap-7 sm:gap-12 md:gap-16 z-20 py-4 px-2">
          {/* Screencast */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleToggleScreenShare}
              className={`flex h-15 w-15 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-all border shadow-xl active:scale-95 ${
                isSharingScreen
                  ? 'bg-[#496D6B] text-[#D9D0B8] border-[#71877B]'
                  : 'bg-[#202A2D] hover:bg-[#2B3940] text-[#D9D0B8] border-[#3A4B4D]'
              }`}
              title="Screencast"
            >
              <ScreencastIcon className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
            <span className="text-xs font-medium text-[#D9D0B8] tracking-wide">Screencast</span>
          </div>

          {/* Start Video / Stop Video */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={toggleVideo}
              className={`flex h-15 w-15 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-all border shadow-xl active:scale-95 ${
                activeCall.isVideoOff
                  ? 'bg-[#202A2D] text-[#A8AAA0] border-[#3A4B4D] hover:bg-[#2B3940]'
                  : 'bg-[#496D6B] text-[#D9D0B8] border-[#71877B] hover:bg-[#5a7d78]'
              }`}
              title={activeCall.isVideoOff ? 'Start Video' : 'Stop Video'}
            >
              {activeCall.isVideoOff ? (
                <SolidVideoOffIcon className="h-6 w-6 sm:h-7 sm:w-7" />
              ) : (
                <SolidVideoIcon className="h-6 w-6 sm:h-7 sm:w-7" />
              )}
            </button>
            <span className="text-xs font-medium text-[#D9D0B8] tracking-wide">
              {activeCall.isVideoOff ? 'Start Video' : 'Stop Video'}
            </span>
          </div>

          {/* End Call */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={endCall}
              className="flex h-15 w-15 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#B87568] hover:bg-[#C98679] text-[#171A1C] shadow-2xl transition-transform active:scale-90 border-2 border-[#B87568]"
              title="End Call"
            >
              <SolidEndCallIcon className="h-7 w-7 sm:h-8 sm:w-8" />
            </button>
            <span className="text-xs font-semibold text-[#B87568] tracking-wide">End Call</span>
          </div>

          {/* Mute */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className={`flex h-15 w-15 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-all border shadow-xl active:scale-95 ${
                activeCall.isMuted
                  ? 'bg-[#B87568] text-[#171A1C] border-[#B87568]'
                  : 'bg-[#202A2D] hover:bg-[#2B3940] text-[#D9D0B8] border-[#3A4B4D]'
              }`}
              title={activeCall.isMuted ? 'Unmute' : 'Mute'}
            >
              {activeCall.isMuted ? (
                <SolidMicOffIcon className="h-6 w-6 sm:h-7 sm:w-7" />
              ) : (
                <SolidMicIcon className="h-6 w-6 sm:h-7 sm:w-7" />
              )}
            </button>
            <span className="text-xs font-medium text-[#D9D0B8] tracking-wide">
              {activeCall.isMuted ? 'Unmute' : 'Mute'}
            </span>
          </div>
        </div>


      </div>
    </div>
  );
};


