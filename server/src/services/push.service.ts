import { GoogleAuth } from 'google-auth-library';
import { prisma } from '../config/database.js';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface CallWakeupPayload {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  callType: 'voice' | 'video';
  conversationId?: string;
}

export class PushService {
  private auth: GoogleAuth | null = null;
  private projectId: string;
  private isConfigured: boolean = false;

  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'orbit-social-app';
    const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    try {
      if (keyJson) {
        const credentials = JSON.parse(keyJson);
        this.auth = new GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });
        this.projectId = credentials.project_id || this.projectId;
        this.isConfigured = true;
      } else if (keyPath) {
        this.auth = new GoogleAuth({
          keyFilename: keyPath,
          scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });
        this.isConfigured = true;
      } else {
        // Fallback for development without service account
        this.auth = new GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });
        this.isConfigured = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      }
    } catch (err) {
      console.warn('[Push] Firebase GoogleAuth init notice:', (err as any).message);
    }
  }

  private async getAccessToken(): Promise<string | null> {
    if (!this.auth) return null;
    try {
      const client = await this.auth.getClient();
      const tokenResponse = await client.getAccessToken();
      return tokenResponse.token || null;
    } catch (err) {
      console.warn('[Push] Could not retrieve FCM v1 access token:', (err as any).message);
      return null;
    }
  }

  private async sendSingleFCM(deviceToken: string, messageBody: any): Promise<void> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token: deviceToken,
              ...messageBody,
            },
          }),
        }
      );

      if (response.status === 404) {
        // Token is UNREGISTERED or invalid — prune it from database
        await prisma.deviceToken.deleteMany({ where: { token: deviceToken } });
        console.warn(`[Push] Pruned dead FCM token: ${deviceToken.slice(0, 12)}...`);
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Push] FCM HTTP Error:', response.status, errorData);
      }
    } catch (err) {
      console.error('[Push] FCM dispatch network error:', err);
    }
  }

  public async sendToUser(userId: string, payload: PushNotificationPayload): Promise<void> {
    const devices = await prisma.deviceToken.findMany({ where: { user_id: userId } });
    if (!devices.length) return;

    await Promise.allSettled(
      devices.map((d) =>
        this.sendSingleFCM(d.token, {
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data || {},
          android: {
            priority: 'high',
            notification: {
              channelId: 'messages',
              sound: 'default',
            },
          },
        })
      )
    );
  }

  public async sendCallWakeup(userId: string, callData: CallWakeupPayload): Promise<void> {
    const devices = await prisma.deviceToken.findMany({ where: { user_id: userId } });
    if (!devices.length) return;

    // High-priority DATA-ONLY message for OS wakeup & CallKeep displayIncomingCall
    await Promise.allSettled(
      devices.map((d) =>
        this.sendSingleFCM(d.token, {
          data: {
            type: 'INCOMING_CALL',
            callId: callData.callId,
            callerId: callData.callerId,
            callerName: callData.callerName,
            callerAvatar: callData.callerAvatar,
            callType: callData.callType,
            conversationId: callData.conversationId || '',
          },
          android: {
            priority: 'high',
            ttl: '30s',
          },
        })
      )
    );
  }
}

export const pushService = new PushService();
