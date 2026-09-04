/**
 * Orbit — push notifications (BACKEND side)
 * ========================================================
 *
 * The shell CANNOT ring the phone when it's backgrounded/killed: the WebView's
 * JavaScript is frozen, so the web app's live socket is dead. The ONLY path is
 * a native push notification (FCM). Three halves must exist:
 *
 *   [1] APP (shell)  — registers its FCM token and hands it to the web app;
 *                      forwards foreground pushes back to the web app.
 *   [2] WEB APP      — forwards the token to YOUR backend (per user) and
 *                      reacts to forwarded call/missed-call pushes.
 *   [3] BACKEND      — when someone calls a user, send a push to their tokens
 *                      (this file). Send a second "missed call" push if the
 *                      call was never answered.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * [2] Add these listeners to your Orbit WEB APP:
 *
 *   // (a) The device's FCM token → register with your backend, tied to the
 *   //     logged-in user (credentials:'include' sends the session cookie).
 *   window.addEventListener('orbit:push-token', (e) => {
 *     fetch('/api/push/register', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       credentials: 'include',
 *       body: JSON.stringify({ token: e.detail }),
 *     });
 *   });
 *
 *   // (b) Foreground fallback: the shell forwards push data here while the
 *   //     app is open. Use it to ring (or show a missed-call badge) even
 *   //     when the live socket is dead or lagging.
 *   //
 *   //     NOTE: all FCM data values arrive as STRINGS. And you MUST dedup by
 *   //     callId — if your socket also delivered the call, skip it so the
 *   //     user doesn't get a double ring.
 *   window.addEventListener('orbit:call-push', (e) => {
 *     const d = e.detail;
 *     if (d.type === 'call') {
 *       if (!isAlreadyRinging(d.callId)) ringIncomingCall(d.callId, d.callerName, d.url);
 *     } else if (d.type === 'missed_call') {
 *       if (!alreadyShownMissed(d.callId)) showMissedCallBadge(d.callId, d.callerName);
 *     }
 *   });
 *
 *   // (c) On logout / account switch:
 *   fetch('/api/push/unregister', { method: 'POST', credentials: 'include' });
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Run this with a Firebase Admin service-account JSON from the SAME Firebase
 * project that generated the google-services.json in the APK
 * (project orbit-social-c90ed). Set GOOGLE_APPLICATION_CREDENTIALS to it.
 */

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

// Token storage: userId -> Set<string> of FCM tokens. Use your own DB
// (Firestore, Postgres, etc.). This is a stub for illustration.
const tokenStore = {
  tokensByUser: new Map(),
  async save(userId, token) {
    if (!this.tokensByUser.has(userId)) this.tokensByUser.set(userId, new Set());
    this.tokensByUser.get(userId).add(token);
  },
  async remove(userId, token) {
    this.tokensByUser.get(userId)?.delete(token);
  },
  async getAll(userId) {
    return [...(this.tokensByUser.get(userId) ?? [])];
  },
};

/** POST /api/push/register  → called by the web app with the logged-in user. */
async function registerDevice(reqUserId, token) {
  await tokenStore.save(reqUserId, token);
}

/** POST /api/push/unregister → called by the web app on logout. */
async function unregisterDevice(reqUserId, token) {
  await tokenStore.remove(reqUserId, token);
}

/**
 * Send an incoming-call push to `calleeUserId`.
 *
 * IMPORTANT — it MUST be a *notification* message (title/body present) so
 * Android shows it in the tray even when the app is killed, and it MUST target
 * the `calls` channel that the shell creates on launch (importance MAX →
 * heads-up + sound + vibration). `priority: 'high'` stops FCM from delaying it.
 *
 * @param {object} opts
 * @param {string} opts.calleeUserId  the Orbit user being called
 * @param {string} opts.callId        unique id for this call (dedup key)
 * @param {string} opts.callerName    display name of the caller
 * @param {string} opts.callUrl       e.g. https://orbit-web-6z3b.onrender.com/call/<roomId>
 */
async function sendIncomingCallPush({ calleeUserId, callId, callerName, callUrl }) {
  const tokens = await tokenStore.getAll(calleeUserId);
  if (tokens.length === 0) return;

  const message = {
    tokens,
    notification: {
      title: callerName || 'Incoming call',
      body: 'Incoming Orbit call',
    },
    data: {
      type: 'call',
      callId: String(callId),
      callerName: String(callerName || ''),
      url: String(callUrl),
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'calls', // MUST match CALLS_CHANNEL_ID in App.tsx
        sound: 'default',
        priority: 'high',
        visibility: 'public',
      },
    },
  };

  await dispatch(tokens, message);
}

/**
 * Send a "missed call" push when the callee never answered (call ended, no
 * answer, or the caller hung up after ringing).
 *
 * This is informational, so it uses the normal-priority `default` channel
 * (no urgent heads-up) and deep-links to the chat/conversation so tapping it
 * opens the right place to call back.
 *
 * @param {object} opts
 * @param {string} opts.calleeUserId
 * @param {string} opts.callId
 * @param {string} opts.callerName
 * @param {string} opts.chatUrl      e.g. https://orbit-web-6z3b.onrender.com/chat/<callerId>
 */
async function sendMissedCallPush({ calleeUserId, callId, callerName, chatUrl }) {
  const tokens = await tokenStore.getAll(calleeUserId);
  if (tokens.length === 0) return;

  const message = {
    tokens,
    notification: {
      title: 'Missed call',
      body: callerName ? `${callerName} tried to call you` : 'You missed an Orbit call',
    },
    data: {
      type: 'missed_call',
      callId: String(callId),
      callerName: String(callerName || ''),
      url: String(chatUrl),
    },
    android: {
      priority: 'normal',
      notification: {
        channelId: 'default', // informational channel, no urgent heads-up
        sound: 'default',
      },
    },
  };

  await dispatch(tokens, message);
}

/** Shared send helper with logging. */
async function dispatch(tokens, message) {
  // firebase-admin v10+: use sendEachForMulticast (sendMulticast is deprecated).
  const result = await admin.messaging().sendEachForMulticast(message);
  console.log('push sent:', result.successCount, 'success,', result.failureCount, 'failed');
  if (result.failureCount > 0) {
    result.responses.forEach((r, i) => {
      if (!r.success) console.log('token', tokens[i], 'failed:', r.error?.code);
    });
  }
}

module.exports = {
  registerDevice,
  unregisterDevice,
  sendIncomingCallPush,
  sendMissedCallPush,
};
