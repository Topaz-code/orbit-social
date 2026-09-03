import { 
  requestCameraPermission, 
  requestMicrophonePermission, 
  requestNotificationPermission, 
  requestCallPermissions 
} from '../lib/permissions';

export function usePermissions() {
  return {
    requestCameraPermission,
    requestMicrophonePermission,
    requestNotificationPermission,
    requestCallPermissions
  };
}
