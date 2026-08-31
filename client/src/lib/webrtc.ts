import { Peer, MediaConnection } from 'peerjs';
import { PEERJS_HOST, PEERJS_PORT, PEERJS_SECURE, PEERJS_PATH, ICE_SERVERS } from './constants.js';

export interface CallMetadata {
  callId: string;
  caller: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  type: 'voice' | 'video';
  conversationId?: string;
}

export interface PeerManagerCallbacks {
  onIncomingCall: (call: MediaConnection, metadata: CallMetadata) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onCallConnected: () => void;
  onCallEnded: () => void;
  onError: (err: any) => void;
}

export class PeerManager {
  private peer: Peer | null = null;
  private currentCall: MediaConnection | null = null;
  private localStream: MediaStream | null = null;
  private callbacks: PeerManagerCallbacks;
  private currentUserId: string | null = null;
  private reconnectTimer: any = null;

  constructor(callbacks: PeerManagerCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Initialize Peer instance for the authenticated user
   */
  public init(userId: string): void {
    if (this.peer && this.currentUserId === userId && !this.peer.destroyed) {
      if (this.peer.disconnected) {
        this.peer.reconnect();
      }
      return;
    }

    this.destroy();
    this.currentUserId = userId;

    try {
      this.peer = new Peer(userId, {
        host: PEERJS_HOST,
        port: PEERJS_PORT,
        path: PEERJS_PATH,
        secure: PEERJS_SECURE,
        debug: 1,
        config: {
          iceServers: ICE_SERVERS,
          iceCandidatePoolSize: 10,
        },
      });

      this.peer.on('open', (id) => {
        console.log(`[PeerJS] Connected to signaling server with Peer ID: ${id}`);
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      });

      this.peer.on('call', (incomingCall) => {
        console.log('[PeerJS] Received incoming call from:', incomingCall.peer);
        const metadata = (incomingCall.metadata || {}) as CallMetadata;
        this.currentCall = incomingCall;
        this.callbacks.onIncomingCall(incomingCall, metadata);
      });

      this.peer.on('disconnected', () => {
        console.warn('[PeerJS] Disconnected from signaling server. Reconnecting in 3s...');
        if (!this.reconnectTimer && !this.peer?.destroyed) {
          this.reconnectTimer = setTimeout(() => {
            if (this.peer && !this.peer.destroyed && this.peer.disconnected) {
              this.peer.reconnect();
            }
            this.reconnectTimer = null;
          }, 3000);
        }
      });

      this.peer.on('error', (err: any) => {
        console.error('[PeerJS] Peer error:', err);
        if (err.type === 'unavailable-id') {
          console.warn('[PeerJS] Peer ID already active on server');
        } else {
          this.callbacks.onError(err);
        }
      });
    } catch (err) {
      console.error('[PeerJS] Failed to instantiate Peer:', err);
    }
  }

  /**
   * Start an outgoing call to targetUserId
   */
  public makeCall(
    targetUserId: string,
    stream: MediaStream,
    metadata: CallMetadata
  ): MediaConnection | null {
    if (!this.peer || this.peer.destroyed) {
      console.error('[PeerJS] Cannot make call: Peer instance is not ready');
      return null;
    }

    this.localStream = stream;

    const call = this.peer.call(targetUserId, stream, {
      metadata,
    });

    if (!call) {
      console.error('[PeerJS] Call initiation returned null');
      return null;
    }

    this.currentCall = call;
    this.bindCallEvents(call);
    return call;
  }

  /**
   * Answer an incoming call with localStream
   */
  public answerCall(call: MediaConnection, stream: MediaStream): void {
    this.localStream = stream;
    this.currentCall = call;

    call.answer(stream);
    this.bindCallEvents(call);
  }

  /**
   * Bind stream, close, and error listeners to an active call
   */
  private bindCallEvents(call: MediaConnection): void {
    call.on('stream', (remoteStream) => {
      console.log('[PeerJS] Remote media stream received');
      this.callbacks.onRemoteStream(remoteStream);
      this.callbacks.onCallConnected();
    });

    call.on('close', () => {
      console.log('[PeerJS] Call closed by peer');
      this.cleanupCurrentCall();
      this.callbacks.onCallEnded();
    });

    call.on('error', (err) => {
      console.error('[PeerJS] MediaConnection error:', err);
      this.cleanupCurrentCall();
      this.callbacks.onCallEnded();
    });
  }

  /**
   * End current call and stop media tracks
   */
  public hangUp(): void {
    if (this.currentCall) {
      try {
        this.currentCall.close();
      } catch {}
      this.currentCall = null;
    }

    this.cleanupCurrentCall();
  }

  private cleanupCurrentCall(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.localStream = null;
    }
  }

  /**
   * Destroy the peer instance completely (e.g. on logout)
   */
  public destroy(): void {
    this.hangUp();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }
    this.currentUserId = null;
  }
}

