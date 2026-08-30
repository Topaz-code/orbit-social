import { ICE_SERVERS } from './constants.js';

export interface WebRTCEvents {
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onSendSignal: (signalData: any) => void;
  onError?: (err: any) => void;
}

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private remoteDescriptionSet = false;
  private events: WebRTCEvents;

  constructor(events: WebRTCEvents) {
    this.events = events;
  }

  private initPeerConnection(): RTCPeerConnection {
    if (this.pc) return this.pc;

    const config: RTCConfiguration = {
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,
    };

    const pc = new RTCPeerConnection(config);
    this.pc = pc;
    this.remoteDescriptionSet = false;
    this.pendingCandidates = [];

    // Attach local stream tracks if available
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Remote track listener
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.events.onRemoteStream(event.streams[0]);
      } else {
        const stream = new MediaStream([event.track]);
        this.events.onRemoteStream(stream);
      }
    };

    // ICE Candidate generation -> send to peer via MQTT
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.events.onSendSignal({
          type: 'ICE_CANDIDATE',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      this.events.onConnectionStateChange(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        try {
          pc.restartIce();
        } catch {
          // ignore if unsupported
        }
      }
    };

    return pc;
  }

  public setLocalStream(stream: MediaStream) {
    this.localStream = stream;
    if (this.pc) {
      const senders = this.pc.getSenders();
      stream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track);
        } else {
          this.pc!.addTrack(track, stream);
        }
      });
    }
  }

  /**
   * Caller: initiates call by generating an SDP offer
   */
  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    const pc = this.initPeerConnection();
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await pc.setLocalDescription(offer);

    this.events.onSendSignal({
      type: 'SDP_OFFER',
      sdp: offer,
    });

    return offer;
  }

  /**
   * Callee: receives SDP offer, creates SDP answer
   */
  public async handleOffer(offerSdp: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const pc = this.initPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
    this.remoteDescriptionSet = true;
    await this.processPendingCandidates();

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.events.onSendSignal({
      type: 'SDP_ANSWER',
      sdp: answer,
    });

    return answer;
  }

  /**
   * Caller: receives SDP answer from callee
   */
  public async handleAnswer(answerSdp: RTCSessionDescriptionInit) {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
    this.remoteDescriptionSet = true;
    await this.processPendingCandidates();
  }

  /**
   * Receive and apply ICE candidate or buffer if remote description isn't set yet
   */
  public async handleCandidate(candidateInit: RTCIceCandidateInit) {
    if (this.pc && this.remoteDescriptionSet) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidateInit));
      } catch (e) {
        console.warn('[WebRTC] Error adding ICE candidate:', e);
      }
    } else {
      this.pendingCandidates.push(candidateInit);
    }
  }

  private async processPendingCandidates() {
    if (!this.pc || !this.remoteDescriptionSet) return;
    while (this.pendingCandidates.length > 0) {
      const cand = this.pendingCandidates.shift();
      if (cand) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn('[WebRTC] Error processing buffered ICE candidate:', e);
        }
      }
    }
  }

  /**
   * Clean up all media tracks and peer connection
   */
  public close() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    if (this.pc) {
      this.pc.ontrack = null;
      this.pc.onicecandidate = null;
      this.pc.onconnectionstatechange = null;
      this.pc.close();
      this.pc = null;
    }

    this.pendingCandidates = [];
    this.remoteDescriptionSet = false;
  }
}
