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

// Default credentials for the Orbit Firebase project (orbit-social-c90ed)
const DEFAULT_FIREBASE_CREDENTIALS = {
  type: 'service_account',
  project_id: 'orbit-social-c90ed',
  private_key_id: '2e300fb230eaf3d1508617363494f0a0aff8fd8a',
  private_key:
    '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCaJPrFjNGS1S+S\nU9gMIsLc3FxA0CKMdtJZ6vt4OOE5NeColg0eLsDoAmCLRCQnUidAmq4Xb7kBd1z3\ncL9dL4WdsSo/YZHNvRL4v2saXyyc0qP68mwuEEFg1xVlpRvfCbRH7rhxKUN2fvvf\niiqiEndxLbaeGmZXX8svefXDFHHt68OC88MbSxmvyDkZSLHJnXMQKm8+dmhERA0I\nqM1cPFf41GppXBd32oaFf2bnZYpVeCcFVreqcu+5JqvH6vTZuquVTRp2Lt2shW95\nJuNDU0vLsJq5YxXuqRtnL2bSgb68aZ4p6SROVCgcAeCL/zZv73qsqa0+rNDNbV2a\n4X8Gkj0PAgMBAAECggEADu9yVN3WGJILb/QrxNFBbED1t1nzXwTMUOYRw45PVEnC\nINOZJcmF63T/gb7yedTd9MaIA8FRfbDhEyCbih3mpmbaHxYHGJYvVmbFq+J44iEO\nvmvqy3PLweRVMGoVD0FTdHzO5jgHT13ybbBnfRio9hBl11/bdq/TciAxDdvXRiQh\nZCP8r34Ny6IyLzAhFxNEW+8KV/wPmQbEAjBt4Mie5nwIwRaHXytK9Hijf1ktiXUn\nOBBfqkB0/+3Qg9hL/sTOifyrzwk+dEUMZEBaIsKB9XdDtAeS6kbctao5JHK4sT3q\ngRfKlvnBjdLLDReNAK6KMXcEesiNdvZRYfNq4jxDgQKBgQDMxBorBG4CUm6VcdXq\nG5sj9NqyIHT7K+2IeIjcN0mlyU5XYX2Id1JqNrdJUYiF9qDWbWKDkmc+NZ4MjMfn\nidt8rwvEbcvXXN2XeMZYwv27eAbBYsS/aJdyVikgEFYHSfH/+g4PlAKFvMwmbFbp\no/AN3je9IAb3oXYqzit/fQn84QKBgQDAtmitzLwkcHW0sRx+qTzJ246zE+kXvqmv\nqVgjaJOQwqK6iNNVHzmScKmjgyFGYXlaiuiF6HgXF4mSWAzinaW400ImjbTNzybP\nKRCzqIrpbIdfdFHIN8lLrQF8l5qJaK+/H7fHIYLgtz5mWpLZPqwEtoehMOjC21gu\nrTumIfUH7wKBgBWBZworje46gBi7+u56dcHB/pIErKSQiYLyvdT7DYYW7V5qA8go\nWASFuJw/run67At5M4aEAsna0b2Zr4kWxnGC5OZ9bZIx06gL7DD4UbO1uGfpGqbL\nslQ0zl7quE5NqtfqiD2Emvs2x+4lJL+nExgxxYLccT7iu0llm9Xo6PqhAoGAbY4F\nWnCesLSCJdPeGB+L4FGCAUobZBVPD/7cjVyhL1WG/zZTtfuHVjnYJo2geAtn2tJH\nOAEdbDtEST7nLFlk4fqvi41ZsPrH3FNDHG9/cQ3ys5BEAee89tmGk9b30pACAUw9\nxOXHKorh3Xw2KWyYjCFcX4WXfVcG/Zob4+lADF8CgYEAwlIVQAsndUsi4PEr9Y9C\nTD1wytSxTMv/u1zlC0IRTrxpHYrn1ejlbhlJ99w0tkOATKomqyM/yiNTpiaJc1qZ\nxfcNID8jQNVYJEkjCzJtMwFDJ8E1h6jOiTnEPWNl++uM0IMwSrkeO4ygKRWsFK5E\nPhi9eN+ZiYIjYTrvwRoCy4o=\n-----END PRIVATE KEY-----\n',
  client_email: 'firebase-adminsdk-fbsvc@orbit-social-c90ed.iam.gserviceaccount.com',
  client_id: '108580892633808290152',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40orbit-social-c90ed.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com',
};

export class PushService {
  private auth: GoogleAuth | null = null;
  private projectId: string = 'orbit-social-c90ed';
  private isConfigured: boolean = false;

  constructor() {
    const envProjectId =
      process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
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
        this.projectId = envProjectId || this.projectId;
        this.isConfigured = true;
      } else {
        // Use embedded credentials for orbit-social-c90ed
        this.auth = new GoogleAuth({
          credentials: DEFAULT_FIREBASE_CREDENTIALS,
          scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });
        this.projectId = DEFAULT_FIREBASE_CREDENTIALS.project_id;
        this.isConfigured = true;
      }
      console.log(`[Push] Initialized FCM v1 for project: ${this.projectId}`);
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

    // High-priority Heads-Up Notification targeting 'calls' channel (Importance: MAX)
    await Promise.allSettled(
      devices.map((d) =>
        this.sendSingleFCM(d.token, {
          notification: {
            title: `Incoming ${callData.callType === 'video' ? 'Video' : 'Voice'} Call`,
            body: `${callData.callerName} is calling you...`,
          },
          data: {
            type: 'call',
            callId: String(callData.callId),
            callerId: String(callData.callerId),
            callerName: String(callData.callerName),
            callerAvatar: String(callData.callerAvatar || ''),
            callType: String(callData.callType),
            conversationId: String(callData.conversationId || ''),
            url: `orbit://call/${callData.callId}`,
          },
          android: {
            priority: 'HIGH',
            ttl: '45s',
            notification: {
              channel_id: 'calls',
              notification_priority: 'PRIORITY_MAX',
              default_sound: true,
              default_vibrate_timings: true,
              visibility: 'PUBLIC',
            },
          },
        })
      )
    );
  }
}

export const pushService = new PushService();
