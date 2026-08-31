import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import RNCallKeep from 'react-native-callkeep';
import notifee, { AndroidImportance, AndroidCategory, EventType } from '@notifee/react-native';

// 1. Background FCM Message Handler (Executes even when App is KILLED)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[FCM] Background Data Message Received:', remoteMessage);

  if (remoteMessage.data?.type === 'INCOMING_CALL') {
    const { callId, callerName, callType } = remoteMessage.data;

    // Display incoming call through CallKeep (triggers showIncomingCallUi event)
    RNCallKeep.displayIncomingCall(
      callId,
      callerName,
      callerName,
      'generic',
      callType === 'video'
    );
  } else if (remoteMessage.notification) {
    await notifee.displayNotification({
      title: remoteMessage.notification.title,
      body: remoteMessage.notification.body,
      data: remoteMessage.data,
      android: {
        channelId: 'messages',
        pressAction: { id: 'default' },
      },
    });
  }
});

// 2. CRITICAL: Show Incoming Call Fullscreen UI on Android (Self-Managed Mode)
RNCallKeep.addEventListener('showIncomingCallUi', ({ handle, callUUID, name }) => {
  notifee.displayNotification({
    id: callUUID,
    title: name || handle,
    body: 'Incoming Orbit Call...',
    android: {
      channelId: 'calls',
      asForegroundService: true,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      fullScreenAction: { id: 'incoming-call' },
      actions: [
        { title: 'Decline', pressAction: { id: 'endCall' } },
        { title: 'Accept', pressAction: { id: 'answerCall' } },
      ],
    },
  });
});

// 3. Fallback when Android Telecom blocks incoming connection
RNCallKeep.addEventListener('createIncomingConnectionFailed', ({ callUUID }) => {
  console.warn('[CallKeep] Android blocked incoming connection for call:', callUUID);
  RNCallKeep.endCall(callUUID);
});

// 4. Notifee background action buttons handler
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS) {
    if (detail.pressAction?.id === 'endCall' && detail.notification?.id) {
      RNCallKeep.endCall(detail.notification.id);
      await notifee.cancelNotification(detail.notification.id);
    } else if (detail.pressAction?.id === 'answerCall' && detail.notification?.id) {
      RNCallKeep.answerIncomingCall(detail.notification.id);
      RNCallKeep.backToForeground();
      await notifee.cancelNotification(detail.notification.id);
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
