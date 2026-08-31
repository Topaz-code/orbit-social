import RNCallKeep from 'react-native-callkeep';
import { PermissionsAndroid, Platform, NativeModules } from 'react-native';

export async function checkFullScreenIntentPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || (Platform.Version as number) < 34) return true;
  try {
    const { NotificationManager } = NativeModules;
    return (await NotificationManager?.canUseFullScreenIntent?.()) ?? true;
  } catch {
    return true;
  }
}

export async function initializeCallKeep(onCallAnswered?: (callUUID: string) => void): Promise<void> {
  const options = {
    ios: { appName: 'Orbit' },
    android: {
      alertTitle: 'Permissions Required',
      alertDescription: 'Orbit requires phone account access to receive incoming calls on your lockscreen.',
      cancelButton: 'Cancel',
      okButton: 'Enable',
      imageName: 'ic_launcher',
      additionalPermissions: [
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ],
      foregroundService: {
        channelId: 'calls',
        channelName: 'Orbit Calls in Progress',
        notificationTitle: 'Orbit Call Active',
        notificationIcon: 'ic_launcher',
      },
    },
  };

  try {
    await RNCallKeep.setup(options);
    RNCallKeep.setAvailable(true);

    // Cold-start event replay for calls answered before JS loaded
    const initialEvents = await RNCallKeep.getInitialEvents();
    if (initialEvents && initialEvents.length > 0) {
      for (const event of initialEvents) {
        if (event.name === 'RNCallKeepPerformAnswerCallAction') {
          RNCallKeep.backToForeground();
          onCallAnswered?.(event.data.callUUID);
        }
      }
      RNCallKeep.clearInitialEvents();
    }
  } catch (error) {
    console.error('[CallKeep] Initialization Error:', error);
  }
}
