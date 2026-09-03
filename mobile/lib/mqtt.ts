import mqtt from 'mqtt/dist/mqtt.min';
import 'react-native-get-random-values';
import { MQTT_URL } from '../constants';
import * as SecureStore from 'expo-secure-store';

class MQTTService {
  private client: mqtt.MqttClient | null = null;
  private messageCallbacks: Map<string, ((topic: string, message: Buffer) => void)[]> = new Map();

  async connect(userId?: string, tokenOverride?: string) {
    if (this.client?.connected) return;

    const token = tokenOverride || (await SecureStore.getItemAsync('access_token'));

    this.client = mqtt.connect(MQTT_URL, {
      clientId: `orbit_client_${userId || ''}_${Math.random().toString(16).slice(3)}`,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 2000,
      username: 'orbit',
      password: token || '',
    });

    this.client.on('connect', () => {
      // Re-subscribe to all active topics
      Array.from(this.messageCallbacks.keys()).forEach((topic) => {
        this.client?.subscribe(topic);
      });
    });

    this.client.on('message', (topic: string, message: Buffer) => {
      this.messageCallbacks.forEach((callbacks, subscribedTopic) => {
        if (this.topicMatch(subscribedTopic, topic)) {
          callbacks.forEach((cb) => cb(topic, message));
        }
      });
    });
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
    if (!this.client?.connected) return;
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    this.client.publish(topic, payload, { qos: 1 });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }
}

export const mqttService = new MQTTService();
export const mqttClient = mqttService;
export default mqttService;
