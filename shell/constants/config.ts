export const ORBIT_URL = "https://orbit-web-6z3b.onrender.com/";

export const ORBIT_HOST = "orbit-web-6z3b.onrender.com";

export const SHELL_VERSION = "1.0.0";

export const SHELL_USER_AGENT_SUFFIX = `OrbitAndroidShell/${SHELL_VERSION}`;



/** Endpoint on the Orbit backend that stores a device push token for the signed-in user. */
export const PUSH_REGISTER_ENDPOINT = "https://orbit-api-m5ah.onrender.com/api/device/token";



export const COLORS = {

  bg: "#0f172a",

  bgElevated: "#111c33",

  gold: "#d4a24c",

  goldLight: "#f1d18a",

  goldDeep: "#b8863b",

  tan: "#c9a36a",

  slate: "#94a3b8",

  slateDark: "#475569",

  text: "#e2e8f0",

  danger: "#ef4444",

  success: "#22c55e",

} as const;



export const CHANNELS = {

  CALLS: "orbit_calls",

  MESSAGES: "orbit_messages",

} as const;



export const CALL_NOTIFICATION_ID = "orbit-incoming-call";

export const CALL_RING_TIMEOUT_MS = 45_000;



export const STORAGE_KEYS = {

  PUSH_TOKEN: "orbit.push.token",

  EXPO_PUSH_TOKEN: "orbit.push.expoToken",

  PERMISSIONS_PROMPTED: "orbit.permissions.prompted",

  PENDING_ROUTE: "orbit.pending.route",

  LAST_CALL: "orbit.call.last",

  DEVICE_SECRET: "orbit.device.secret",

} as const;



export const BACKGROUND_NOTIFICATION_TASK = "ORBIT_BACKGROUND_NOTIFICATION_TASK";



/** Render free-tier dynos sleep after inactivity; the first request can take 30-60s. */

export const COLD_START = {

  hintAfterMs: 6_000,

  retryDelaysMs: [3_000, 5_000, 8_000, 12_000, 15_000, 20_000],

  hardTimeoutMs: 90_000,

} as const;
