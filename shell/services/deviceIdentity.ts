import * as Crypto from "expo-crypto";

import * as SecureStore from "expo-secure-store";

import { STORAGE_KEYS } from "../constants/config";

import { hmacSha256Hex, sha256Hex } from "../crypto/sha256";



export interface DeviceIdentity {

  /** Persistent random secret stored in the Android Keystore. Never sent to the server. */

  secret: string;

  /** Deterministic public identifier: SHA-256(secret). Safe to embed in payloads and URLs. */

  hash: string;

}



let cachedIdentity: DeviceIdentity | null = null;



function randomBytesHex(length: number): string {

  const bytes = Crypto.getRandomBytes(length);

  return Array.from(bytes)

    .map((b: number) => b.toString(16).padStart(2, "0"))

    .join("");

}



/**

 * Returns (creating on first launch) the device's persistent identity.

 *

 * A headless React Native fetch does NOT share the WebView's cookie jar, so a

 * session-cookie-authenticated decline endpoint would 401 for declines made from

 * the lock-screen notification. The shell therefore authenticates cookielessly:

 *

 *   - secret: 48 random bytes in the Android Keystore (source of truth, never leaves the device)

 *   - deviceHash: SHA-256(secret) — public identifier, registered alongside the push token

 *

 * The decline endpoint verifies via buildDeclineProof() below. Because the backend issue is

 * "it never sees `secret`", the proof uses nested hashing so the server needs nothing more

 * than deviceHash: HMAC(key = SHA-256(deviceHash), `${callId}:${ts}`) === proof.

 * See README → "Decline authentication (headless)" for the recipe.

 */

export async function getDeviceIdentity(): Promise<DeviceIdentity> {

  if (cachedIdentity) return cachedIdentity;



  let secret = await SecureStore.getItemAsync(STORAGE_KEYS.DEVICE_SECRET);

  if (!secret) {

    secret = randomBytesHex(48);

    await SecureStore.setItemAsync(STORAGE_KEYS.DEVICE_SECRET, secret);

  }



  const hash = sha256Hex(secret);

  cachedIdentity = { secret, hash };

  return cachedIdentity;

}



export interface DeclineProof {

  deviceHash: string;

  callId: string;

  ts: number;

  /** HMAC-SHA256(key = SHA-256(deviceHash), data = `${callId}:${ts}`) */

  proof: string;

}



/**

 * Builds a cookieless, replay-resistant "this device declined this call" proof.

 * The timestamp binds the proof to one particular ring, and the server can rate-limit

 * stale timestamps instead of tracking state.

 */

export async function buildDeclineProof(callId: string): Promise<DeclineProof> {

  const identity = await getDeviceIdentity();

  const ts = Date.now();

  const key = sha256Hex(identity.hash);

  const proof = hmacSha256Hex(key, `${callId}:${ts}`);

  return { deviceHash: identity.hash, callId, ts, proof };

}
