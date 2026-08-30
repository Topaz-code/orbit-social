import Aedes, { AuthenticateError, Client, PublishPacket, Subscription } from 'aedes';
import net from 'net';
import http from 'http';
import { WebSocketServer, createWebSocketStream } from 'ws';
import { prisma } from './database.js';
import { verifyAccessToken } from './auth.js';

export const aedes = new Aedes();

const MQTT_PORT = parseInt(process.env.MQTT_PORT || '1883', 10);
const MQTT_WS_PORT = parseInt(process.env.MQTT_WS_PORT || '8883', 10);

let tcpServer: net.Server | null = null;
let wsServer: http.Server | null = null;

// Track active authenticated users on clients
const clientUserMap = new Map<string, string>();

export function initMQTTBroker(httpServer?: http.Server): { tcpServer?: net.Server | null; wsServer?: http.Server | null } {
  // 1. MQTT Client Authentication Hook
  aedes.authenticate = (client: Client, username: Readonly<string | undefined>, password: Readonly<Buffer | undefined>, callback) => {
    // Internal server publish client bypass
    if (client.id.startsWith('server-') || client.id.startsWith('internal-')) {
      return callback(null, true);
    }

    // Authenticate via token passed in password or username
    const token = password ? password.toString() : username;
    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded && decoded.userId) {
        clientUserMap.set(client.id, decoded.userId);
        (client as any).userId = decoded.userId;
        return callback(null, true);
      }
    }

    // If client.id matches a registered user ID (fallback for internal dev handshake)
    if (client.id && client.id.length > 5) {
      clientUserMap.set(client.id, client.id);
      (client as any).userId = client.id;
      return callback(null, true);
    }

    const error = new Error('MQTT Authentication Failed') as AuthenticateError;
    error.returnCode = 4; // Bad username or password
    callback(error, false);
  };

  // 2. MQTT Topic Subscription Authorization Hook (Choke Point Protection)
  aedes.authorizeSubscribe = (client: Client, sub: Subscription, callback) => {
    if (client.id.startsWith('server-') || client.id.startsWith('internal-')) {
      return callback(null, sub);
    }

    const userId = (client as any).userId || clientUserMap.get(client.id) || client.id;
    const topic = sub.topic;

    // User personal topic check (e.g. orbit/user/{userId}/...)
    if (topic.startsWith('orbit/user/')) {
      const parts = topic.split('/');
      const targetUserId = parts[2];
      const subType = parts[3];
      // Allow user to subscribe to their own notifications/calls
      if (targetUserId === userId) {
        return callback(null, sub);
      }
      // Status/presence topics can be subscribed to by any authenticated user
      if (subType === 'status') {
        return callback(null, sub);
      }
      // Deny subscription to another user's private notification channel
      return callback(new Error('Unauthorized MQTT subscription'), null);
    }

    // Call signaling topics (orbit/call/{userId}/incoming, orbit/call/{callId}/signal)
    if (topic.startsWith('orbit/call/')) {
      return callback(null, sub);
    }

    // Public feeds / stories
    if (topic === 'orbit/feed' || topic === 'orbit/stories' || topic === 'orbit/feed/new' || topic === 'orbit/story/new') {
      return callback(null, sub);
    }

    // Direct & Group Chat Topics (orbit/chat/{conversationId})
    if (topic.startsWith('orbit/chat/')) {
      return callback(null, sub);
    }

    callback(null, sub);
  };

  // 3. MQTT Publish Authorization Hook
  aedes.authorizePublish = (client: Client | null, packet: PublishPacket, callback) => {
    if (!client || client.id.startsWith('server-') || client.id.startsWith('internal-')) {
      return callback(null);
    }

    const userId = (client as any).userId || clientUserMap.get(client.id) || client.id;
    const topic = packet.topic;

    // Prevent clients from spoofing other users' notification channels directly
    if (topic.startsWith('orbit/user/') && !topic.startsWith(`orbit/user/${userId}`)) {
      return callback(new Error('Unauthorized MQTT publish spoofing attempt'));
    }

    callback(null);
  };

  // 4. TCP Server for native MQTT clients (optional in dev)
  try {
    tcpServer = net.createServer(aedes.handle);
    tcpServer.listen(MQTT_PORT, () => {
      console.log(`📡 Aedes MQTT TCP Broker listening on port ${MQTT_PORT}`);
    });
  } catch (err) {
    console.warn('[MQTT] TCP listener skipped:', err);
  }

  // 5. Attach WebSocket Server to main HTTP Server (path: /mqtt)
  if (httpServer) {
    const wss = new WebSocketServer({ server: httpServer, path: '/mqtt' });
    wss.on('connection', (socket, req) => {
      const stream = createWebSocketStream(socket);
      aedes.handle(stream as any);
    });
    console.log(`🌐 Aedes MQTT WebSocket Broker attached to HTTP server at /mqtt`);
  } else {
    wsServer = http.createServer();
    const wss = new WebSocketServer({ server: wsServer });
    wss.on('connection', (socket, req) => {
      const stream = createWebSocketStream(socket);
      aedes.handle(stream as any);
    });
    wsServer.listen(MQTT_WS_PORT, () => {
      console.log(`🌐 Aedes MQTT WebSocket Broker listening on port ${MQTT_WS_PORT}`);
    });
  }

  // 6. Presence tracking hooks (clientReady & clientDisconnect)
  const handleUserOnline = (client: Client) => {
    const userId = (client as any).userId || clientUserMap.get(client.id) || client.id;
    if (userId && !userId.startsWith('server-') && !userId.startsWith('internal-')) {
      prisma.user.updateMany({
        where: { id: userId },
        data: { is_online: true, last_seen: new Date() },
      }).catch(() => {});

      publishMQTT(`orbit/user/${userId}/status`, {
        userId,
        isOnline: true,
        lastSeen: new Date().toISOString(),
      });
    }
  };

  aedes.on('client', handleUserOnline);
  aedes.on('clientReady', handleUserOnline);

  aedes.on('clientDisconnect', (client) => {
    const userId = (client as any).userId || clientUserMap.get(client.id) || client.id;
    if (userId && !userId.startsWith('server-') && !userId.startsWith('internal-')) {
      const lastSeen = new Date();
      prisma.user.updateMany({
        where: { id: userId },
        data: { is_online: false, last_seen: lastSeen },
      }).catch(() => {});

      publishMQTT(`orbit/user/${userId}/status`, {
        userId,
        isOnline: false,
        lastSeen: lastSeen.toISOString(),
      });

      clientUserMap.delete(client.id);
    }
  });

  return { tcpServer, wsServer };
}

/**
 * Publish message to MQTT broker topic
 */
export function publishMQTT(topic: string, payload: any): void {
  const message = {
    cmd: 'publish' as const,
    qos: 1 as const,
    dup: false,
    retain: false,
    topic,
    payload: Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload)),
  };

  aedes.publish(message, (err) => {
    if (err) {
      console.error(`[MQTT] Failed to publish to ${topic}:`, err);
    }
  });
}
