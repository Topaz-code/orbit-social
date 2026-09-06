import { GoogleAuth } from 'google-auth-library';
import { prisma } from '../config/database.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/auth.js';

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
  private projectId: string = 'orbit-social-c90ed';
  private isConfigured: boolean = false;

  constructor() {
    const envProjectId =
      process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const keyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    try {
      if (keyJson) {
        const credentials = JSON.parse(keyJson);
        this.auth = new GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });
        this.projectId = credentials.project_id || envProjectId || this.projectId;
        this.isConfigured = true;
        console.log(`[Push] Initialized FCM v1 from JSON for project: ${this.projectId}`);
      } else if (keyBase64) {
        const decoded = Buffer.from(keyBase64, 'base64').toString('utf8');
        const credentials = JSON.parse(decoded);
        this.auth = new GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });
        this.projectId = credentials.project_id || envProjectId || this.projectId;
        this.isConfigured = true;
        console.log(`[Push] Initialized FCM v1 from Base64 for project: ${this.projectId}`);
      } else if (keyPath) {
        this.auth = new GoogleAuth({
          keyFilename: keyPath,
          scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });
        this.projectId = envProjectId || this.projectId;
        this.isConfigured = true;
        console.log(`[Push] Initialized FCM v1 from file path for project: ${this.projectId}`);
      } else {
        this.projectId = envProjectId || this.projectId;
        this.isConfigured = false;
        console.warn(
          '[Push] No Firebase service account configured (set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_BASE64). FCM push notifications will be skipped.'
        );
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
    if (!accessToken) {
      console.warn('[Push] Skipping FCM dispatch: No access token available');
      return;
    }

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
        console.error('[Push] FCM HTTP Error:', response.status, JSON.stringify(errorData));
      } else {
        console.log(`[Push] Successfully sent FCM message to ${deviceToken.slice(0, 12)}...`);
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
            priority: 'HIGH',
            notification: {
              channel_id: 'default',
              default_sound: true,
              visibility: 'PUBLIC',
            },
          },
        })
      )
    );
  }

  public async sendCallWakeup(userId: string, callData: CallWakeupPayload): Promise<void> {
    const devices = await prisma.deviceToken.findMany({ where: { user_id: userId } });
    if (!devices.length) return;

    // Generate signed one-time decline token (valid for 3 minutes) for cookieless lockscreen decline
    const declineToken = jwt.sign(
      { callId: callData.callId, userId, purpose: 'decline_call' },
      JWT_SECRET,
      { expiresIn: '3m' }
    );
    const declineUrl = `https://orbit-api-m5ah.onrender.com/api/calls/${callData.callId}/decline?token=${declineToken}`;

    // Data-only high priority message: Android OS wakes com.orbit.app headless (no passive tray intercept)
    await Promise.allSettled(
      devices.map((d) =>
        this.sendSingleFCM(d.token, {
          data: {
            type: 'incoming_call',
            callId: String(callData.callId),
            callerId: String(callData.callerId),
            callerName: String(callData.callerName),
            callerAvatar: String(callData.callerAvatar || ''),
            isVideo: callData.callType === 'video' ? 'true' : 'false',
            callType: String(callData.callType),
            conversationId: String(callData.conversationId || ''),
            url: `/calls/${callData.callId}?callerId=${encodeURIComponent(callData.callerId)}&callerName=${encodeURIComponent(callData.callerName)}&callerAvatar=${encodeURIComponent(callData.callerAvatar || '')}&callType=${encodeURIComponent(callData.callType)}`,
            declineUrl,
            startedAt: String(Date.now()),
          },
          android: {
            priority: 'HIGH',
            ttl: '45s',
          },
        })
      )
    );
  }

  public async sendCallCancelled(userId: string, callId: string): Promise<void> {
    const devices = await prisma.deviceToken.findMany({ where: { user_id: userId } });
    if (!devices.length) return;

    // Send high-priority cancellation to dismiss heads-up notification / stop ringtone
    await Promise.allSettled(
      devices.map((d) =>
        this.sendSingleFCM(d.token, {
          data: {
            type: 'call_cancelled',
            callId: String(callId),
          },
          android: {
            priority: 'HIGH',
            ttl: '15s',
          },
        })
      )
    );
  }
}

export const pushService = new PushService();
