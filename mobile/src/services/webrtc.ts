import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    ...(process.env.TURN_SERVER_URL
      ? [
          {
            urls: process.env.TURN_SERVER_URL,
            username: process.env.TURN_USERNAME || '',
            credential: process.env.TURN_CREDENTIAL || '',
          },
        ]
      : []),
  ],
};

export class NativePeerManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  public onRemoteStream?: (stream: MediaStream) => void;

  public async getLocalStream(isVideo: boolean): Promise<MediaStream> {
    const isFront = true;
    const stream = (await mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: isVideo
        ? {
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 },
            frameRate: { min: 15, ideal: 30 },
            facingMode: isFront ? 'user' : 'environment',
          }
        : false,
    })) as MediaStream;

    this.localStream = stream;
    return stream;
  }

  public async createPeerConnection(
    onSendSignal: (type: string, data: any) => void
  ): Promise<RTCPeerConnection> {
    this.pc = new RTCPeerConnection(ICE_SERVERS);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.pc!.addTrack(track, this.localStream!);
      });
    }

    this.pc.addEventListener('icecandidate', (event: any) => {
      if (event.candidate) {
        onSendSignal('ice-candidate', event.candidate);
      }
    });

    this.pc.addEventListener('track', (event: any) => {
      if (event.streams && event.streams[0]) {
        this.onRemoteStream?.(event.streams[0]);
      }
    });

    return this.pc;
  }

  public async createOffer(): Promise<any> {
    if (!this.pc) throw new Error('PeerConnection not initialized');
    const offer = await this.pc.createOffer({});
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  public async handleAnswer(answer: any): Promise<void> {
    if (this.pc) {
      await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  public async handleIceCandidate(candidate: any): Promise<void> {
    if (this.pc) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  public handleAppStateChange(isBackground: boolean): void {
    if (!this.localStream) return;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      // Pause camera on background to prevent Android OS killing camera service
      videoTrack.enabled = !isBackground;
    }
  }

  public close(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }
}
