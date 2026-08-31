import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, ActivityIndicator, View, Text } from 'react-native';
import { setupNotificationChannels, registerDeviceToken } from './services/notificationService';
import { initializeCallKeep } from './services/callService';
import { useNativeCall } from './hooks/useNativeCall';
import { useCallStore } from './stores/callStore';
import { useAuthStore } from './stores/authStore';
import { socketService } from './services/socketService';
import { NativeActiveCallView } from './components/calls/NativeActiveCallView';
import { LoginScreen } from './screens/auth/LoginScreen';
import { RegisterScreen } from './screens/auth/RegisterScreen';
import { MainNavigator } from './navigation/MainNavigator';

export const App: React.FC = () => {
  const { activeCall } = useCallStore();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useNativeCall();

  useEffect(() => {
    async function bootstrap() {
      await checkAuth();
      await setupNotificationChannels();
      await registerDeviceToken();
      await initializeCallKeep();
    }

    bootstrap();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#171A1C" />
        <View style={styles.centerBox}>
          <Text style={styles.loadingLogo}>🪐</Text>
          <Text style={styles.loadingTitle}>Orbit</Text>
          <ActivityIndicator size="large" color="#D0A56A" style={styles.spinner} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#171A1C" />

      {activeCall ? (
        <NativeActiveCallView />
      ) : isAuthenticated ? (
        <MainNavigator />
      ) : authMode === 'login' ? (
        <LoginScreen onSwitchToRegister={() => setAuthMode('register')} />
      ) : (
        <RegisterScreen onSwitchToLogin={() => setAuthMode('login')} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171A1C',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#171A1C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBox: {
    alignItems: 'center',
  },
  loadingLogo: {
    fontSize: 48,
    marginBottom: 12,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#D9D0B8',
  },
  spinner: {
    marginTop: 24,
  },
});

export default App;
