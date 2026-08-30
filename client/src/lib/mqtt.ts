import mqtt, { MqttClient } from 'mqtt';
import { MQTT_WS_URL } from './constants.js';

type MessageCallback = (topic: string, message: any) => void;

class OrbitMQTTClient {
  private client: MqttClient | null = null;
  private subscribers: Map<string, Set<MessageCallback>> = new Map();
  private isConnected = false;
  private currentUserId: string | null = null;

  connect(userId: string) {
    if (this.client && this.currentUserId === userId && this.isConnected) {
      return;
    }

    if (this.client) {
      this.client.end(true);
    }

    this.currentUserId = userId;
    console.log(`[MQTT] Connecting to ${MQTT_WS_URL} as client: ${userId}`);

    try {
      this.client = mqtt.connect(MQTT_WS_URL, {
        clientId: userId,
        clean: true,
        reconnectPeriod: 3000,
        connectTimeout: 10000,
      });

      this.client.on('connect', () => {
        console.log('✅ [MQTT] Connected to Orbit broker');
        this.isConnected = true;

        // Auto-subscribe to user specific topics
        this.subscribe(`orbit/user/${userId}/status`);
        this.subscribe(`orbit/user/${userId}/notifications`);
        this.subscribe(`orbit/call/${userId}/incoming`);
        this.subscribe('orbit/feed/new');
        this.subscribe('orbit/story/new');

        // Re-subscribe to any previously registered topics
        for (const topic of this.subscribers.keys()) {
          this.client?.subscribe(topic, (err) => {
            if (err) console.error(`[MQTT] Resubscribe error on ${topic}:`, err);
          });
        }
      });

      this.client.on('message', (topic, payload) => {
        try {
          const parsed = JSON.parse(payload.toString());
          const handlers = this.subscribers.get(topic);
          if (handlers) {
            handlers.forEach((cb) => cb(topic, parsed));
          }
        } catch (err) {
          console.error(`[MQTT] Error parsing message on topic ${topic}:`, err);
        }
      });

      this.client.on('error', (err) => {
        console.warn('[MQTT] Client connection error (will retry):', err.message);
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });
    } catch (err) {
      console.error('[MQTT] Failed to initialize MQTT client:', err);
    }
  }

  subscribe(topic: string, callback?: MessageCallback): () => void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
      if (this.client && this.isConnected) {
        this.client.subscribe(topic, (err) => {
          if (err) console.error(`[MQTT] Subscribe error on ${topic}:`, err);
        });
      }
    }

    if (callback) {
      this.subscribers.get(topic)!.add(callback);
    }

    return () => {
      if (callback && this.subscribers.has(topic)) {
        this.subscribers.get(topic)!.delete(callback);
      }
    };
  }

  unsubscribe(topic: string) {
    if (this.client && this.isConnected) {
      this.client.unsubscribe(topic);
    }
    this.subscribers.delete(topic);
  }

  publish(topic: string, message: any) {
    if (this.client && this.isConnected) {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      this.client.publish(topic, payload, { qos: 1 });
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end(true);
      this.client = null;
      this.isConnected = false;
      this.currentUserId = null;
    }
  }
}

export const mqttClient = new OrbitMQTTClient();
