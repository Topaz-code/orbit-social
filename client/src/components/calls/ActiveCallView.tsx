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

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!activeCall) return null;

  const isVideoCall = activeCall.type === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full h-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex flex-col justify-between p-6 m-4">
        {/* Call Header */}
        <div className="flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <Avatar
              src={activeCall.remoteUser.avatar_url}
              fallback={activeCall.remoteUser.display_name}
              size="md"
            />
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {activeCall.remoteUser.display_name}
              </h3>
              <p className="text-xs text-indigo-400 font-mono">
                {activeCall.status === 'ringing'
                  ? 'Ringing...'
                  : formatCallDuration(activeCall.duration)}
              </p>
            </div>
          </div>
        </div>

        {/* Video / Audio Center Stage */}
        <div className="relative flex-1 my-4 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
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
                  <p className="text-sm font-semibold text-white">Connecting video stream...</p>
                </div>
              )}

              {/* Local PiP (Picture-in-Picture) */}
              <div className="absolute top-4 right-4 h-36 w-28 sm:h-44 sm:w-36 rounded-2xl overflow-hidden border-2 border-white/40 shadow-2xl bg-black z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover mirror"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {activeCall.isVideoOff && (
                  <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-xs text-slate-400">
                    Camera off
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Voice Call Center Avatar Stage */
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <span className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
                <Avatar
                  src={activeCall.remoteUser.avatar_url}
                  fallback={activeCall.remoteUser.display_name}
                  size="xl"
                  className="h-32 w-32"
                />
              </div>
              <h2 className="text-2xl font-black text-white">{activeCall.remoteUser.display_name}</h2>
              <p className="text-sm text-slate-400 mt-1">
                {activeCall.status === 'ringing' ? 'Calling...' : 'Voice Call Active'}
              </p>
              {/* Hidden audio element for remote audio track */}
              <audio ref={remoteVideoRef} autoPlay playsInline />
            </div>
          )}
        </div>

        {/* Bottom Control Actions Bar */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 z-20 py-2">
          {/* Mute toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
              activeCall.isMuted
                ? 'bg-rose-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white'
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
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                activeCall.isVideoOff
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
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
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            title="Speaker"
          >
            {activeCall.isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={endCall}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/30 transition-transform active:scale-95 ml-2"
            title="End Call"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
