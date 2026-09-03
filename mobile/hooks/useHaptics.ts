import { Platform } from 'react-native';

export function useHaptics() {
  const lightImpact = () => {};
  const mediumImpact = () => {};
  const success = () => {};
  const error = () => {};

  return { lightImpact, mediumImpact, success, error };
}
