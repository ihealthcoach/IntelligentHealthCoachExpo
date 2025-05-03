import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage wrapper with built-in error handling
export const safeStorage = {
  /**
   * Safely get an item from storage with error recovery
   */
  getItem: async (key, defaultValue = null) => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        return JSON.parse(value);
      }
      return defaultValue;
    } catch (error) {
      console.warn(`Error reading ${key} from AsyncStorage:`, error);
      // If there's an error, clear the corrupted data
      try {
        await AsyncStorage.removeItem(key);
      } catch (removeError) {
        console.error(`Failed to remove corrupted key ${key}:`, removeError);
      }
      return defaultValue;
    }
  },

  /**
   * Safely set an item in storage
   */
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving ${key} to AsyncStorage:`, error);
      return false;
    }
  },

  /**
   * Safely remove an item from storage
   */
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from AsyncStorage:`, error);
      return false;
    }
  },

  /**
   * Safely clear all storage (with recovery on failure)
   */
  clear: async () => {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      
      // Fallback: try to get all keys and remove them individually
      try {
        const keys = await AsyncStorage.getAllKeys();
        await AsyncStorage.multiRemove(keys);
        return true;
      } catch (fallbackError) {
        console.error('Fatal storage error:', fallbackError);
        return false;
      }
    }
  },

  /**
   * Initialize storage with error recovery
   * Call this function early in your app startup
   */
  initialize: async () => {
    try {
      // Test if storage is working properly
      await AsyncStorage.getItem('storage_test');
      return true;
    } catch (error) {
      console.warn('AsyncStorage may be corrupted, attempting recovery:', error);
      
      // Recovery attempt - clear storage
      try {
        await AsyncStorage.clear();
        console.log('AsyncStorage recovery successful');
        return true;
      } catch (clearError) {
        console.error('AsyncStorage recovery failed:', clearError);
        return false;
      }
    }
  }
};