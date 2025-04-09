import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import { Navigation } from './src/navigation';
import { networkSyncService } from './src/services/NetworkSyncService';

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
    <PaperProvider>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </PaperProvider>
  );
} 