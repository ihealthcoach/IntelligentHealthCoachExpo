import { useEffect, useRef, useState } from 'react';
import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

// Timer state interface
export interface RestTimerState {
  isActive: boolean;
  timeRemaining: number;
  defaultDuration: number;
  exerciseId: string | null;
  setId: string | null;
}

// Initial timer state
const initialTimerState: RestTimerState = {
  isActive: false,
  timeRemaining: 0,
  defaultDuration: 90, // Default 90 seconds rest
  exerciseId: null,
  setId: null
};

/**
 * Hook to manage the rest timer functionality
 * @param onTimerComplete Callback for when timer completes
 * @param defaultRestDuration Default rest duration in seconds
 */
export function useRestTimer(
  onTimerComplete?: () => void,
  defaultRestDuration: number = 90
) {
  // Rest timer state
  const [restTimer, setRestTimer] = useState<RestTimerState>({
    ...initialTimerState,
    defaultDuration: defaultRestDuration
  });
  
  // Timer interval reference
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Effect for rest timer
  useEffect(() => {
    if (restTimer.isActive && restTimer.timeRemaining > 0) {
      timerInterval.current = setInterval(() => {
        setRestTimer(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }));
      }, 1000);
      
      return () => {
        if (timerInterval.current) {
          clearInterval(timerInterval.current);
          timerInterval.current = null;
        }
      };
    } else if (restTimer.isActive && restTimer.timeRemaining <= 0) {
      // Timer completed
      handleTimerComplete();
    }
  }, [restTimer.isActive, restTimer.timeRemaining]);
  
  // Handle timer completion
  const handleTimerComplete = () => {
    // Vibrate device
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Vibration.vibrate([0, 100, 200, 300]);
    }
    
    // Reset timer state to inactive
    setRestTimer(prev => ({
      ...prev,
      isActive: false
    }));
    
    // Call the completion callback if provided
    if (onTimerComplete) {
      onTimerComplete();
    }
  };
  
  // Start or reset the rest timer
  const startRestTimer = (exerciseId: string, setId: string, customDuration?: number) => {
    // Clear any existing timer
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    
    // Use custom duration or default
    const duration = customDuration || restTimer.defaultDuration;
    
    setRestTimer({
      isActive: true,
      timeRemaining: duration,
      defaultDuration: duration,
      exerciseId,
      setId
    });
  };
  
  // Pause the rest timer
  const pauseRestTimer = () => {
    setRestTimer(prev => ({
      ...prev,
      isActive: false
    }));
  };
  
  // Resume the rest timer
  const resumeRestTimer = () => {
    setRestTimer(prev => ({
      ...prev,
      isActive: true
    }));
  };
  
  // Skip the rest timer
  const skipRestTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    
    setRestTimer(prev => ({
      ...prev,
      isActive: false,
      timeRemaining: 0
    }));
  };
  
  // Format time for display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    };
  }, []);
  
  return {
    restTimer,
    startRestTimer,
    pauseRestTimer,
    resumeRestTimer,
    skipRestTimer,
    formatTime
  };
}