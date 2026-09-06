import {
  Room,
  RoomEvent,
  Track,
  VideoPresets,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  ConnectionState,
} from 'livekit-client';

export interface LiveKitCallbacks {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onCallConnected?: () => void;
  onCallEnded?: (reason?: string) => void;
  onError?: (error: any) => void;
}

export class LiveKitManager {
  private room: Room | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callbacks: LiveKitCallbacks;
  private audioElement: HTMLAudioElement | null = null;

  constructor(callbacks: LiveKitCallbacks = {}) {
    this.callbacks = callbacks;
  }

  setCallbacks(callbacks: LiveKitCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  getRoom(): Room | null {
    return this.room;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  isConnected(): boolean {
    return this.room?.state === ConnectionState.Connected;
  }

  async connect({
    url,
    token,
    isVideo = false,
  }: {
    url: string;
    token: string;
    isVideo?: boolean;
  }): Promise<Room> {
    if (this.room) {
      await this.disconnect();
    }

    this.localStream = new MediaStream();
    this.remoteStream = new MediaStream();

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
      },
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.room = room;

    // Handle remote track subscribed
    room.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrack, _publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        console.log(`[LiveKit] Remote track subscribed: ${track.kind} from ${participant.identity}`);

        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }

        if (track.mediaStreamTrack) {
          // Remove previous track of same kind if present to prevent duplicates
          const existing = this.remoteStream.getTracks().filter((t) => t.kind === track.kind);
          existing.forEach((t) => this.remoteStream!.removeTrack(t));

          this.remoteStream.addTrack(track.mediaStreamTrack);

          // Dedicated hidden audio element for reliable remote audio playback
          if (track.kind === Track.Kind.Audio) {
            try {
              if (this.audioElement) {
                this.audioElement.srcObject = null;
                this.audioElement.remove();
              }
              const audio = track.attach();
              audio.style.display = 'none';
              audio.id = 'livekit-remote-audio';
              document.body.appendChild(audio);
              this.audioElement = audio;
            } catch (err) {
              console.warn('[LiveKit] Auto-attaching audio element warning:', err);
            }
          }

          // Trigger stream update callback with a fresh MediaStream reference
          const updated = new MediaStream(this.remoteStream.getTracks());
          this.remoteStream = updated;
          this.callbacks.onRemoteStream?.(updated);
        }

        // Subscribing to tracks means call is actively communicating
        this.callbacks.onCallConnected?.();
      }
    );

    // Handle remote track unsubscribed
    room.on(
      RoomEvent.TrackUnsubscribed,
      (track: RemoteTrack, _publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        console.log(`[LiveKit] Remote track unsubscribed: ${track.kind} from ${participant.identity}`);
        try {
          track.detach();
        } catch {}

        if (this.remoteStream && track.mediaStreamTrack) {
          this.remoteStream.removeTrack(track.mediaStreamTrack);
          const updated = new MediaStream(this.remoteStream.getTracks());
          this.remoteStream = updated;
          this.callbacks.onRemoteStream?.(updated);
        }
      }
    );

    // Remote participant joined the room
    room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      console.log(`[LiveKit] Remote participant joined room: ${participant.identity}`);
      this.callbacks.onCallConnected?.();
    });

    // Remote participant left the room
    room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      console.log(`[LiveKit] Remote participant left room: ${participant.identity}`);
      this.callbacks.onCallEnded?.('remote_disconnected');
    });

    // Room connection closed
    room.on(RoomEvent.Disconnected, () => {
      console.log('[LiveKit] Disconnected from room');
      this.callbacks.onCallEnded?.('room_disconnected');
    });

    try {
      await room.connect(url, token);
      console.log(`[LiveKit] Connected successfully to room: ${room.name}`);

      // Enable local microphone
      await room.localParticipant.setMicrophoneEnabled(true, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });

      // Enable local camera if video call
      if (isVideo) {
        await room.localParticipant.setCameraEnabled(true, {
          resolution: VideoPresets.h720.resolution,
        });
      }

      // Collect local tracks for preview in UI
      this.updateLocalStream();

      // Check if remote participants are already in the room
      if (room.remoteParticipants.size > 0) {
        this.callbacks.onCallConnected?.();

        for (const participant of room.remoteParticipants.values()) {
          for (const pub of participant.trackPublications.values()) {
            if (pub.isSubscribed && pub.track?.mediaStreamTrack) {
              this.remoteStream.addTrack(pub.track.mediaStreamTrack);
              if (pub.track.kind === Track.Kind.Audio) {
                try {
                  const audio = pub.track.attach();
                  audio.style.display = 'none';
                  document.body.appendChild(audio);
                  this.audioElement = audio;
                } catch {}
              }
            }
          }
        }

        if (this.remoteStream.getTracks().length > 0) {
          const updated = new MediaStream(this.remoteStream.getTracks());
          this.remoteStream = updated;
          this.callbacks.onRemoteStream?.(updated);
        }
      }

      return room;
    } catch (error) {
      console.error('[LiveKit] Connection error:', error);
      this.callbacks.onError?.(error);
      throw error;
    }
  }

  private updateLocalStream() {
    if (!this.room) return;
    const tracks: MediaStreamTrack[] = [];
    for (const pub of this.room.localParticipant.trackPublications.values()) {
      if (pub.track?.mediaStreamTrack) {
        tracks.push(pub.track.mediaStreamTrack);
      }
    }
    this.localStream = new MediaStream(tracks);
    this.callbacks.onLocalStream?.(this.localStream);
  }

  async toggleMute(enabled?: boolean): Promise<boolean> {
    if (!this.room) return false;
    const currentlyMuted = !this.room.localParticipant.isMicrophoneEnabled;
    const shouldMute = enabled !== undefined ? enabled : !currentlyMuted;
    await this.room.localParticipant.setMicrophoneEnabled(!shouldMute);
    this.updateLocalStream();
    return shouldMute;
  }

  async toggleVideo(enabled?: boolean): Promise<boolean> {
    if (!this.room) return false;
    const currentVideoOff = !this.room.localParticipant.isCameraEnabled;
    const shouldDisable = enabled !== undefined ? enabled : !currentVideoOff;
    await this.room.localParticipant.setCameraEnabled(!shouldDisable);
    this.updateLocalStream();
    return shouldDisable;
  }

  async disconnect(): Promise<void> {
    if (this.audioElement) {
      try {
        this.audioElement.srcObject = null;
        this.audioElement.remove();
      } catch {}
      this.audioElement = null;
    }

    if (this.room) {
      try {
        // Explicitly stop all local microphone and camera hardware tracks
        const localTracks: any[] = [];
        for (const pub of this.room.localParticipant.trackPublications.values()) {
          if (pub.track) {
            try {
              pub.track.stop();
            } catch {}
            localTracks.push(pub.track);
          }
        }
        if (localTracks.length > 0) {
          try {
            await this.room.localParticipant.unpublishTracks(localTracks);
          } catch {}
        }
        await this.room.disconnect(true);
      } catch (err) {
        console.warn('[LiveKit] Disconnect warning:', err);
      }
      this.room = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.remoteStream = null;
    }
  }
}

let livekitManagerInstance: LiveKitManager | null = null;

export function getLiveKitManager(callbacks?: LiveKitCallbacks): LiveKitManager {
  if (!livekitManagerInstance) {
    livekitManagerInstance = new LiveKitManager(callbacks);
  } else if (callbacks) {
    livekitManagerInstance.setCallbacks(callbacks);
  }
  return livekitManagerInstance;
}
