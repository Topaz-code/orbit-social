/**
 * Browser Desktop Notifications (HTML5 Web Notifications API)
 * Displays native OS notifications when the user is in another tab or the browser is minimized.
 */

let activeCallNotification: Notification | null = null;
let activeCallId: string | null = null;

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    try {
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  }

  return Notification.permission;
}

export function showCallBrowserNotification(options: {
  callId: string;
  callerName: string;
  callerAvatar?: string;
  callType: 'voice' | 'video';
}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  // Dismiss any existing notification first
  dismissCallBrowserNotification();

  try {
    const title = `Incoming ${options.callType === 'video' ? 'Video' : 'Voice'} Call`;
    const notification = new Notification(title, {
      body: `${options.callerName} is calling you on Orbit...`,
      icon: options.callerAvatar || '/favicon.ico',
      badge: '/favicon.ico',
      tag: `orbit-call-${options.callId}`,
      requireInteraction: true, // Keep notification on screen until user interacts
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    activeCallNotification = notification;
    activeCallId = options.callId;
  } catch (err) {
    console.warn('[BrowserNotification] Error displaying call notification:', err);
  }
}

export function dismissCallBrowserNotification(callId?: string) {
  if (activeCallNotification) {
    if (!callId || activeCallId === callId) {
      try {
        activeCallNotification.close();
      } catch {}
      activeCallNotification = null;
      activeCallId = null;
    }
  }
}

export function showMessageBrowserNotification(senderName: string, content: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  // Only show if document is hidden or not focused
  if (document.visibilityState !== 'hidden') return;

  try {
    const notification = new Notification(`New message from ${senderName}`, {
      body: content.length > 80 ? `${content.slice(0, 77)}...` : content,
      icon: '/favicon.ico',
      tag: `orbit-msg-${Date.now()}`,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setTimeout(() => {
      try {
        notification.close();
      } catch {}
    }, 5000);
  } catch (err) {
    console.warn('[BrowserNotification] Error displaying message notification:', err);
  }
}
