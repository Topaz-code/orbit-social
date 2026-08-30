export const APP_NAME = 'Orbit';
export const APP_TAGLINE = 'Break free. Stay connected.';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const MQTT_WS_URL = import.meta.env.VITE_MQTT_WS_URL || `ws://${window.location.hostname}:8883`;
export const PEERJS_HOST = window.location.hostname;
export const PEERJS_PORT = 5000;
export const PEERJS_PATH = '/peerjs';

export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export const MAX_GROUP_MEMBERS = 10;
export const STORY_DURATION_MS = 6000; // 6 seconds per story item in viewer
