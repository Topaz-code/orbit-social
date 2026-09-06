import { AccessToken } from 'livekit-server-sdk';

const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://orbit-henhp7iq.livekit.cloud';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

export const livekitService = {
  getUrl(): string {
    return LIVEKIT_URL;
  },

  async generateToken(roomName: string, participantIdentity: string, participantName: string): Promise<string> {
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      throw new Error('LiveKit API key or secret not configured');
    }

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantIdentity,
      name: participantName || 'Orbit User',
      ttl: '2h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return await at.toJwt();
  },
};
