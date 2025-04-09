// src/services/NetworkSyncService.ts
import NetInfo from '@react-native-community/netinfo';
import { workoutService } from './workoutService';

/**
 * Service to manage network status monitoring and data synchronization
 */
class NetworkSyncService {
  private unsubscribe: (() => void) | null = null;
  private previouslyOffline = false;

  /**
   * Start monitoring network status changes
   */
  startMonitoring(): void {
    // If already monitoring, stop first
    this.stopMonitoring();

    // Check initial state
    NetInfo.fetch().then(state => {
      this.previouslyOffline = !(state.isConnected && state.isInternetReachable);
    });

    // Subscribe to network status changes
    this.unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable;
      
      // If we were offline and now we're online, try to sync
      if (this.previouslyOffline && isConnected) {
        console.log('Network connection restored, syncing data...');
        this.syncData();
      }
      
      // Update previous state
      this.previouslyOffline = !isConnected;
    });

    console.log('Network monitoring started');
  }

  /**
   * Stop monitoring network status
   */
  stopMonitoring(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      console.log('Network monitoring stopped');
    }
  }

  /**
   * Trigger data synchronization
   */
  async syncData(): Promise<void> {
    try {
      // Sync pending workouts
      await workoutService.syncPendingWorkouts();
      
      // Add other sync functions here as needed
      // e.g., await profileService.syncPendingUpdates();
      
      console.log('Data synchronization completed');
    } catch (error) {
      console.error('Error during data synchronization:', error);
    }
  }

  /**
   * Check if currently online and sync if needed
   */
  async checkAndSync(): Promise<void> {
    try {
      const state = await NetInfo.fetch();
      const isConnected = state.isConnected && state.isInternetReachable;
      
      if (isConnected) {
        await this.syncData();
      }
    } catch (error) {
      console.error('Error checking connection and syncing:', error);
    }
  }
}

// Export a singleton instance
export const networkSyncService = new NetworkSyncService();