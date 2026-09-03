import mqtt from 'mqtt/dist/mqtt.min';
import 'react-native-get-random-values';
import { MQTT_URL } from '../constants';
import * as SecureStore from 'expo-secure-store';

class MQTTService {
  private client: mqtt.MqttClient | null = null;
  private messageCallbacks: Map<string, ((topic: string, message: Buffer) => void)[]> = new Map();
  private connectingPromise: Promise<void> | null = null;
  /** Set by the 'error'/'close' handlers so callers can report WHY it failed. */
  private lastError: string | null = null;

  isConnected() {
    return !!this.client?.connected;
  }

  /** Human-readable reason for the most recent connection failure. */
  getLastError() {
    return this.lastError;
  }

  async connect(userId?: string, tokenOverride?: string) {
    if (this.client?.connected) return;
    if (this.connectingPromise) return this.connectingPromise;
    if (this.client) {
      try {
        this.client.end(true);
      } catch {}
      this.client = null;
    }

    let token: string | null = null;
    try {
      token = tokenOverride || (await SecureStore.getItemAsync('access_token'));
    } catch (e: any) {
      console.warn('[Orbit] SecureStore read failed before MQTT connect:', e?.message || e);
    }

    /**
     * FIX 5 — diagnostics.
     * The broker authenticates with the JWT in the MQTT *password* field
     * (server/src/config/mqtt.ts `aedes.authenticate`). If that token is
     * missing or expired the broker answers CONNACK returnCode 4 and mqtt.js
     * emits 'error' + 'close' — it never emits 'connect'. Previously that only
     * produced a generic "MQTT connection timed out" six seconds later, so
     * there was no way to tell an expired token from a wrong URL. Log the URL
     * and whether a token was actually found on every attempt.
     */
    console.log(
      `[Orbit] MQTT connecting to ${MQTT_URL} (token: ${token ? 'present' : 'MISSING'})`
    );
    if (!token) {
      console.warn(
        '[Orbit] MQTT will be rejected: no access_token. Sign in again or refresh the session.'
      );
    }

    this.lastError = null;

    this.connectingPromise = new Promise<void>((resolve, reject) => {
      let settled = false;
      this.client = mqtt.connect(MQTT_URL, {
        clientId: `orbit_client_${userId || ''}_${Math.random().toString(16).slice(3)}`,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 2000,
        username: 'orbit',
        password: token || '',
      });

      const onConnect = () => {
        if (settled) return;
        settled = true;
        this.lastError = null;
        console.log('[Orbit] MQTT connected to', MQTT_URL);
        // Re-subscribe everything registered before the socket came up.
        Array.from(this.messageCallbacks.keys()).forEach((topic) => {
          this.client?.subscribe(topic);
        });
        this.connectingPromise = null;
        resolve();
      };

      this.client.on('connect', onConnect);

      // FIX 5 — every failure mode is now logged with a reason, and the first
      // one becomes the rejection reason instead of a bare timeout.
      this.client.on('error', (err: Error) => {
        const reason = err?.message || String(err);
        this.lastError = reason;
        console.error('[Orbit] MQTT error:', reason);

        // "Connection refused: bad user name or password" is mqtt.js' wording
        // for CONNACK returnCode 4 — our broker returns that for an invalid or
        // expired JWT. Fail fast instead of retrying for 6 seconds.
        if (!settled && /refused|not authorized|bad user/i.test(reason)) {
          settled = true;
          this.connectingPromise = null;
          reject(new Error(`MQTT rejected the connection: ${reason}`));
        }
      });

      this.client.on('offline', () => {
        console.warn('[Orbit] MQTT offline');
      });

      this.client.on('close', () => {
        console.warn('[Orbit] MQTT socket closed');
        if (!settled) {
          this.lastError = this.lastError || 'MQTT socket closed before connecting';
        }
      });

      this.client.on('reconnect', () => {
        console.log('[Orbit] MQTT reconnecting...');
      });

      this.client.on('end', () => {
        console.log('[Orbit] MQTT client ended');
      });

      this.client.on('message', (topic: string, message: Buffer) => {
        this.messageCallbacks.forEach((callbacks, subscribedTopic) => {
          if (this.topicMatch(subscribedTopic, topic)) {
            callbacks.forEach((cb) => cb(topic, message));
          }
        });
      });

      setTimeout(() => {
        if (!settled && !this.client?.connected) {
          settled = true;
          this.connectingPromise = null;
          const reason =
            this.lastError ||
            `MQTT connection to ${MQTT_URL} timed out (broker unreachable, wrong URL, or a proxy blocked the WebSocket upgrade)`;
          this.lastError = reason;
          console.error('[Orbit] MQTT connect failed:', reason);
          reject(new Error(reason));
        }
      }, 6000);
    }).catch((err) => {
      this.connectingPromise = null;
      throw err;
    });

    return this.connectingPromise;
  }

  /**
   * FIX 5 — wait for the socket instead of polling `isConnected()`.
   *
   * The call screen used to do `await mqttClient.connect(); if
   * (!isConnected()) fail('signaling (MQTT) is offline')`. `connect()` returns
   * immediately when a previous attempt is still in flight, so `isConnected()`
   * was often false at that exact instant and the call died with a misleading
   * message. This resolves as soon as the socket is live (or is already live),
   * and rejects with the real reason.
   */
  async waitForConnection(timeoutMs = 8000): Promise<boolean> {
    if (this.isConnected()) return true;

    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (this.isConnected()) return true;
      await new Promise((r) => setTimeout(r, 250));
    }
    return this.isConnected();
  }

  topicMatch(subscribed: string, actual: string) {
    if (subscribed === actual) return true;
    const subParts = subscribed.split('/');
    const actParts = actual.split('/');
    if (subParts.length !== actParts.length && !subscribed.endsWith('#')) return false;

    for (let i = 0; i < subParts.length; i++) {
      if (subParts[i] === '#') return true;
      if (subParts[i] !== '+' && subParts[i] !== actParts[i]) return false;
    }
    return true;
  }

  subscribe(topic: string, callback: (topic: string, message: Buffer) => void) {
    if (!this.messageCallbacks.has(topic)) {
      this.messageCallbacks.set(topic, []);
      if (this.client?.connected) {
        this.client.subscribe(topic);
      }
    }
    this.messageCallbacks.get(topic)?.push(callback);

    return () => {
      const callbacks = this.messageCallbacks.get(topic) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);

      if (callbacks.length === 0) {
        this.messageCallbacks.delete(topic);
        if (this.client?.connected) {
          this.client.unsubscribe(topic);
        }
      }
    };
  }

  publish(topic: string, message: string | object) {
    if (!this.client?.connected) {
      console.warn('[Orbit] MQTT publish skipped — not connected:', topic);
      return false;
    }
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    this.client.publish(topic, payload, { qos: 1 });
    return true;
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
    this.connectingPromise = null;
  }
}

export const mqttService = new MQTTService();
export const mqttClient = mqttService;
export default mqttService;
