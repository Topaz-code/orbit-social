import React, { useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { setupNotificationChannels, registerDeviceToken } from './services/notificationService';
import { initializeCallKeep } from './services/callService';
import { useNativeCall } from './hooks/useNativeCall';
import { useCallStore } from './stores/callStore';
import { NativeActiveCallView } from './components/calls/NativeActiveCallView';

export const App: React.FC = () => {
  const { activeCall } = useCallStore();
  useNativeCall();

  useEffect(() => {
    async function bootstrap() {
      await setupNotificationChannels();
      await registerDeviceToken();
      await initializeCallKeep();
    }

    bootstrap();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#171A1C" />

      {activeCall ? (
        <NativeActiveCallView />
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>Orbit Social</Text>
          <Text style={styles.subtitle}>Privacy-first real-time network</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171A1C',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D9D0B8',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A8AAA0',
  },
});

export default App;
