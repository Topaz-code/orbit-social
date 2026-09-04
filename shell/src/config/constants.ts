/**
 * Orbit Mobile Shell — Core Constants
 */
export const ORBIT_URL = 'https://orbit-web-6z3b.onrender.com/';
export const APP_SCHEME = 'orbit';

/** Path patterns that indicate an audio or video call is starting */
export const CALL_PATH_RE = /\/(call|room|meet|join|conference|session)\b/i;

/** Cold-start retry parameters for Render spinning up */
export const COLD_START_MAX_RETRIES = 5;
export const COLD_START_BASE_DELAY_MS = 2500;

/** SecureStore flag keys */
export const NOTIF_PROMPT_FLAG = 'orbit.notificationsPrompted';
export const FULL_SCREEN_FLAG = 'orbit.fullScreenPrompted';

/** Android Notification Channels */
export const CALLS_CHANNEL_ID = 'calls';
export const DEFAULT_CHANNEL_ID = 'default';

/** Window CustomEvent names for Web-to-Shell Bridge */
export const BRIDGE_EVENTS = {
  PUSH_TOKEN: 'orbit:push-token',
  CALL_PUSH: 'orbit:call-push',
} as const;
