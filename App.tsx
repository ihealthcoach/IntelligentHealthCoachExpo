import React, { useEffect, useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import { SnackbarProvider } from './src/contexts/SnackbarContext';
import { Navigation } from './src/navigation';
import { networkSyncService } from './src/services/NetworkSyncService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { safeStorage } from './src/utils/storageUtils';

import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  // Add initialization state
  const [storageInitialized, setStorageInitialized] = useState(false);
  const [storageError, setStorageError] = useState(false);

  // Load fonts
  let [fontsLoaded] = useFonts({
    'Inter-Light': Inter_300Light,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Initialize storage early
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        const success = await safeStorage.initialize();
        setStorageInitialized(true);
        if (!success) {
          setStorageError(true);
        }
      } catch (error) {
        console.error('Critical error initializing storage:', error);
        setStorageInitialized(true);
        setStorageError(true);
      }
    };

    initializeStorage();
  }, []);

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

  // Hide splash screen when fonts are loaded and storage is initialized
  useEffect(() => {
    if (fontsLoaded && storageInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, storageInitialized]);

  // Show loading or storage error
  if (!fontsLoaded || !storageInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // Show error screen if storage initialization failed
  if (storageError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Storage Error</Text>
        <Text style={styles.errorMessage}>
          There was a problem accessing local storage. The app has attempted recovery.
        </Text>
        <Text style={styles.errorMessage}>
          Please restart the app. If the problem persists, please reinstall the application.
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <PaperProvider>
        <AuthProvider>
          <SnackbarProvider>
            <Navigation />
          </SnackbarProvider>
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#EF4444',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    color: '#111827',
  },
});