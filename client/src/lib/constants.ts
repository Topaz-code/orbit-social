export const APP_NAME = 'Orbit';
export const APP_TAGLINE = 'Break free. Stay connected.';

const isProductionRender =
  typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (isProductionRender ? 'https://orbit-api-m5ah.onrender.com/api' : '/api');

// Dynamically determine WebSocket / PeerJS endpoint
function getBackendEndpoint() {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const rawApi = import.meta.env.VITE_API_URL;

  if (rawApi && rawApi.startsWith('http')) {
    try {
      const url = new URL(rawApi);
      const isSec = url.protocol === 'https:';
      return {
        hostname: url.hostname,
        port: url.port ? parseInt(url.port, 10) : isSec ? 443 : 80,
        isSecure: isSec,
        wsProtocol: isSec ? 'wss:' : 'ws:',
      };
    } catch {
      // Fallback
    }
  }

  if (isProductionRender) {
    return {
      hostname: 'orbit-api-m5ah.onrender.com',
      port: 443,
      isSecure: true,
      wsProtocol: 'wss:',
    };
  }

  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return {
    hostname,
    port: isHttps ? 443 : 5000,
    isSecure: isHttps,
    wsProtocol: isHttps ? 'wss:' : 'ws:',
  };
}

const endpoint = getBackendEndpoint();

// MQTT WebSocket URL
export const MQTT_WS_URL =
  import.meta.env.VITE_MQTT_WS_URL ||
  (endpoint.isSecure
    ? `wss://${endpoint.hostname}/mqtt`
    : `ws://${endpoint.hostname}:${endpoint.port === 443 ? 5000 : endpoint.port}/mqtt`);

// PeerJS Configuration
export const PEERJS_HOST = endpoint.hostname;
export const PEERJS_PORT = endpoint.port;
export const PEERJS_SECURE = endpoint.isSecure;
export const PEERJS_PATH = '/peerjs';


export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.relay.metered.ca:80' },
  {
    urls: 'turn:global.relay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:global.relay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:global.relay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

export const MAX_GROUP_MEMBERS = 10;
export const STORY_DURATION_MS = 6000; // 6 seconds per story item in viewer

