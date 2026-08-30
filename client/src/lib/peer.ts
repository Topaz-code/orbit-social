import Peer from 'peerjs';
import { PEERJS_HOST, PEERJS_PORT, PEERJS_SECURE, PEERJS_PATH, ICE_SERVERS } from './constants.js';

let peerInstance: Peer | null = null;

export function getPeerInstance(userId: string): Peer {
  if (peerInstance && !peerInstance.destroyed && peerInstance.id === userId) {
    return peerInstance;
  }

  if (peerInstance && !peerInstance.destroyed) {
    peerInstance.destroy();
  }

  peerInstance = new Peer(userId, {
    host: PEERJS_HOST,
    port: PEERJS_PORT,
    secure: PEERJS_SECURE,
    path: PEERJS_PATH,
    config: {
      iceServers: ICE_SERVERS,
    },
    debug: 1,
  });

  peerInstance.on('open', (id) => {
    console.log(`[PeerJS] Peer initialized with ID: ${id}`);
  });

  peerInstance.on('error', (err) => {
    console.warn('[PeerJS] Peer connection error:', err);
  });

  return peerInstance;
}

export function destroyPeerInstance() {
  if (peerInstance) {
    peerInstance.destroy();
    peerInstance = null;
  }
}
