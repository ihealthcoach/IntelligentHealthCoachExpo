import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import { Navigation } from './src/navigation';
import { networkSyncService } from './src/services/NetworkSyncService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

export default function App() {
    // Initialize network monitoring when app starts
    useEffect(() => {
      // Start monitoring network status
      networkSyncService.startMonitoring();
      
      // Check and sync any pending data on app start
      networkSyncService.checkAndSync();
      
      // Clean up when the app is unmounted
      return () => {
        networkSyncService.stopMonitoring();
      };
    }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <PaperProvider>
        <AuthProvider>
          <Navigation />
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});