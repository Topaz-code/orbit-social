import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';
import { mqttClient } from './mqtt';

export class WebRTCHelper {
  peerConnection: RTCPeerConnection | null = null;
  callId: string;
  userId: string;
  onStream: (stream: any) => void;
  private unsubscribeSignal?: () => void;

  constructor(callId: string, userId: string, onStream: (stream: any) => void) {
    this.callId = callId;
    this.userId = userId;
    this.onStream = onStream;
  }

  async setup() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    (this.peerConnection as any).ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        this.onStream(event.streams[0]);
      }
    };

    (this.peerConnection as any).onicecandidate = (event: any) => {
      if (event.candidate) {
        this.sendSignal('ice-candidate', event.candidate);
      }
    };

    // Listen to signaling via MQTT
    this.unsubscribeSignal = mqttClient.subscribe(
      `orbit/call/${this.callId}/signal`,
      (topic: string, message: Buffer) => {
        try {
          const msg = JSON.parse(message.toString());
          if (msg.sender_id === this.userId) return; // ignore own signals

          if (msg.type === 'offer') {
            this.handleOffer(msg.payload);
          } else if (msg.type === 'answer') {
            this.handleAnswer(msg.payload);
          } else if (msg.type === 'ice-candidate') {
            this.handleIceCandidate(msg.payload);
          }
        } catch (e) {
          console.error('Failed to parse signal', e);
        }
      }
    );
  }

  async startCall(localStream: any) {
    if (!this.peerConnection) await this.setup();

    localStream.getTracks().forEach((track: any) => {
      (this.peerConnection as any)?.addTrack(track, localStream);
    });

    const offer = await this.peerConnection!.createOffer({});
    await this.peerConnection!.setLocalDescription(offer);

    this.sendSignal('offer', offer);
  }

  async handleOffer(offer: any) {
    if (!this.peerConnection) await this.setup();

    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);

    this.sendSignal('answer', answer);
  }

  async handleAnswer(answer: any) {
    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIceCandidate(candidate: any) {
    await this.peerConnection!.addIceCandidate(new RTCIceCandidate(candidate));
  }

  sendSignal(type: string, payload: any) {
    mqttClient.publish(
      `orbit/call/${this.callId}/signal`,
      JSON.stringify({
        type,
        payload,
        sender_id: this.userId,
      })
    );
  }

  cleanup() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.unsubscribeSignal) {
      this.unsubscribeSignal();
    }
  }
}
