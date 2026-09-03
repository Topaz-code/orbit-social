import mqtt from 'mqtt/dist/mqtt.min';
import 'react-native-get-random-values';
import { MQTT_URL } from '../constants';
import * as SecureStore from 'expo-secure-store';

class MQTTService {
  private client: mqtt.MqttClient | null = null;
  private messageCallbacks: Map<string, ((topic: string, message: Buffer) => void)[]> = new Map();
  private connectingPromise: Promise<void> | null = null;

  isConnected() {
    return !!this.client?.connected;
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

    const token = tokenOverride || (await SecureStore.getItemAsync('access_token'));

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
        console.log('[Orbit] MQTT connected');
        Array.from(this.messageCallbacks.keys()).forEach((topic) => {
          this.client?.subscribe(topic);
        });
        this.connectingPromise = null;
        resolve();
      };

      this.client.on('connect', onConnect);

      this.client.on('error', (err: Error) => {
        console.error('[Orbit] MQTT error:', err?.message || err);
      });

      this.client.on('offline', () => {
        console.warn('[Orbit] MQTT offline');
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
          reject(new Error('MQTT connection timed out'));
        }
      }, 6000);
    }).catch((err) => {
      this.connectingPromise = null;
      throw err;
    });

    return this.connectingPromise;
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
