import { getLiveKitManager } from './livekit.js';

export function destroyPeerInstance() {
  try {
    getLiveKitManager().disconnect().catch(() => {});
  } catch {}
}

export function getPeerInstance(_userId?: string) {
  return null;
}
