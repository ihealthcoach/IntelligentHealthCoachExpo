import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import { SnackbarProvider } from './src/contexts/SnackbarContext';
import { Navigation } from './src/navigation';
import { networkSyncService } from './src/services/NetworkSyncService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
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
  // Load fonts
  let [fontsLoaded] = useFonts({
    'Inter-Light': Inter_300Light,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

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

    // Hide splash screen when fonts are loaded
    useEffect(() => {
      if (fontsLoaded) {
        SplashScreen.hideAsync();
      }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
      return null;
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
});