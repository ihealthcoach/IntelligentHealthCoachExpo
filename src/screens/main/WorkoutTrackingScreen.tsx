import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
  TextInput,
  Image,
  Vibration,
  Platform,
} from 'react-native';
import { 
  Check, 
  Plus, 
  ArrowLeft, 
  MoreHorizontal, 
  Info, 
  Activity, 
  BarChart3, 
  FileText,
  Timer,
  Award,
  Edit,
  Trash,
  Play,
  Pause,
  RefreshCw,
  Save,
  ChevronUp,
  ChevronDown
} from 'lucide-react-native';
import { Portal, Modal, Button, ProgressBar } from 'react-native-paper';
import { MainStackScreenProps } from '../../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { workoutService } from '../../services/workoutService';
import { useFocusEffect } from '@react-navigation/native';
import {
  Workout,
  WorkoutExercise,
  ExerciseSet,
  SupersetType,
  WorkoutStatus
} from '../../types/workout';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';

// Fonts
import { fonts } from '../../styles/fonts';

// Icons
import ChevronRightMini from '../../assets/icons/chevron-right-mini.svg';

// Colors
import { colors } from '../../styles/colors';

// Get screen dimensions for swipe calculations
const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120; // Minimum distance required for a swipe

// Sound effect imports
// import { Audio } from 'expo-av';

// Define rest timer sound reference
// const restTimerSound = new Audio.Sound();

// Interface for rest timer state
interface RestTimerState {
  isActive: boolean;
  timeRemaining: number;
  defaultDuration: number;
  exerciseId: string | null;
  setId: string | null;
}

export default function WorkoutTrackingScreen({ 
  navigation,
  route 
}: MainStackScreenProps<'WorkoutTracking'>) {
  // Auth context for user info
  const { user } = useAuth();

  // Workout state
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [allSetsCompleted, setAllSetsCompleted] = useState(false);
  const [completionSheetVisible, setCompletionSheetVisible] = useState(false);
  const completionSheetRef = useRef(null);
  const [showSetSheet, setShowSetSheet] = useState(false);
  
  // Set editing state
  const [editingWeight, setEditingWeight] = useState<{setId: string, value: string} | null>(null);
  const [editingReps, setEditingReps] = useState<{setId: string, value: string} | null>(null);
  const [editingRPE, setEditingRPE] = useState<{setId: string, value: number | null} | null>(null);
  
  // Rest timer state
  const [restTimer, setRestTimer] = useState<RestTimerState>({
    isActive: false,
    timeRemaining: 0,
    defaultDuration: 90, // Default 90 seconds rest
    exerciseId: null,
    setId: null
  });
  
  // Visual feedback states
  const [lastCompletedSetId, setLastCompletedSetId] = useState<string | null>(null);
  const [showPrConfetti, setShowPrConfetti] = useState(false);
  const [isCheckingPR, setIsCheckingPR] = useState(false);
  
  // Note editing
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [exerciseNotes, setExerciseNotes] = useState('');
  
  // Expanded sections
  const [showExerciseHistory, setShowExerciseHistory] = useState(false);
  
  // Animation values for swipe
  const position = useRef(new Animated.Value(0)).current;
  const setCompleteAnimation = useRef(new Animated.Value(0)).current;
  
  // logfullWorkout
  const logFullWorkout = async (message) => {
    try {
      const workoutJson = await AsyncStorage.getItem('current_workout');
      if (workoutJson) {
        const workout = JSON.parse(workoutJson);
        const completedSets = workout.exercises.reduce((total, ex) => 
          total + (ex.sets.filter(s => s.isComplete).length), 0);
        
        console.log(`${message} - ID: ${workout.id}, Total exercises: ${workout.exercises.length}, Total completed sets: ${completedSets}`);
        
        // Log each exercise and its completed sets
        workout.exercises.forEach((ex, i) => {
          const exCompletedSets = ex.sets.filter(s => s.isComplete).length;
          console.log(`Exercise ${i+1}: ${ex.name}, Sets: ${ex.sets.length}, Completed: ${exCompletedSets}`);
          
          // Log each set's completion status
          ex.sets.forEach((set, j) => {
            console.log(`  Set ${j+1}: isComplete=${set.isComplete}, weight=${set.weight}, reps=${set.reps}`);
          });
        });
      } else {
        console.log(`${message} - No workout found in AsyncStorage`);
      }
    } catch (error) {
      console.error(`Error in logFullWorkout: ${error}`);
    }
  };

  // saveWorkoutToStorage
  const saveWorkoutToStorage = async (workout) => {
    if (!workout) return false;
    
    try {
      // Create deep copy to ensure clean data
      const workoutCopy = JSON.parse(JSON.stringify(workout));
      
      // Log before saving
      console.log(`Saving workout ${workoutCopy.id} with ${workoutCopy.exercises.length} exercises`);
      const completedSets = workoutCopy.exercises.reduce((total, ex) => 
        total + ex.sets.filter(s => s.isComplete).length, 0);
      console.log(`Total completed sets before saving: ${completedSets}`);
      
      // Save directly to AsyncStorage
      await AsyncStorage.setItem('current_workout', JSON.stringify(workoutCopy));
      
      // Verify the save
      await logFullWorkout("After saving to AsyncStorage");
      
      return true;
    } catch (error) {
      console.error(`Error saving workout to AsyncStorage: ${error}`);
      return false;
    }
  };

  // Function to help verify data between operations
const verifyWorkoutData = async (label: string) => {
  try {
    // Compare in-memory workout with stored workout
    const storedJson = await AsyncStorage.getItem('current_workout');
    if (!storedJson) {
      console.log(`${label}: No workout in AsyncStorage`);
      return;
    }
    
    if (!workout) {
      console.log(`${label}: No workout in memory`);
      return;
    }
    
    const storedWorkout = JSON.parse(storedJson);
    
    // Count sets and completed sets
    const memoryCompletedSets = workout.exercises.reduce((total, ex) => 
      total + ex.sets.filter(s => s.isComplete).length, 0);
    
    const storedCompletedSets = storedWorkout.exercises.reduce((total, ex) => 
      total + ex.sets.filter(s => s.isComplete).length, 0);
    
    console.log(`${label}: Memory: ${memoryCompletedSets} completed sets, Stored: ${storedCompletedSets} completed sets`);
    
    if (memoryCompletedSets !== storedCompletedSets) {
      console.error(`${label}: DATA MISMATCH - Different completed set counts!`);
    }
    
    // Check first exercise details for both versions
    if (workout.exercises[0] && storedWorkout.exercises[0]) {
      const memEx = workout.exercises[0];
      const storedEx = storedWorkout.exercises[0];
      
      console.log(`${label}: First exercise comparison:`);
      console.log(`Memory: ${memEx.sets.length} sets, ${memEx.sets.filter(s => s.isComplete).length} completed`);
      console.log(`Stored: ${storedEx.sets.length} sets, ${storedEx.sets.filter(s => s.isComplete).length} completed`);
    }
    
  } catch (error) {
    console.error(`Error in verifyWorkoutData (${label}):`, error);
  }
};

  // Timer interval reference
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Load workout data when the component mounts
  useEffect(() => {
    loadWorkoutData();
    
    // Initialize sounds
    // initSounds();
    
    return () => {
      // Clean up any timers
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      
      // Save workout data when unmounting - use IIFE for async
      (async () => {
        await saveWorkoutData();
      })();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // This runs when the screen comes into focus
      loadWorkoutData();
      return () => {
        // Optional cleanup
      };
    }, [])
  );

  // Add this effect to check if all sets are completed
  useEffect(() => {
    if (!workout) return;
    
    const currentExercise = workout.exercises[currentExerciseIndex];
    const allCompleted = currentExercise.sets.length > 0 && 
      currentExercise.sets.every(set => set.isComplete);
    
    if (allCompleted && !allSetsCompleted) {
      setAllSetsCompleted(true);
      setCompletionSheetVisible(true);
    } else if (!allCompleted && allSetsCompleted) {
      setAllSetsCompleted(false);
    }
  }, [workout, currentExerciseIndex]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Get exercise index from navigation params
        const exerciseIndex = route.params?.exerciseIndex ?? 0;
        
        // Load workout data from AsyncStorage
        const currentWorkout = await workoutService.getCurrentWorkout();
        
        if (currentWorkout) {
          setWorkout(currentWorkout);
          
          // Set exercise index from params
          if (exerciseIndex >= 0 && exerciseIndex < currentWorkout.exercises.length) {
            setCurrentExerciseIndex(exerciseIndex);
          }
          
          // Check if workout has been started
          const hasStarted = currentWorkout.exercises?.some(exercise => 
            exercise.sets?.some(set => set.isComplete)
          );
          setWorkoutStarted(hasStarted);
        }
      } catch (error) {
        console.error('Error loading workout data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Add these functions to handle sheet actions
  const handleAddMoreSets = () => {
    setCompletionSheetVisible(false);
    // Show set picker bottom sheet
    setShowSetSheet(true);
  };
  
  const handleGoToNextExercise = async () => {
    setCompletionSheetVisible(false);
    await handleNextExercise();
  };
  
  const handleContinueEditing = () => {
    setCompletionSheetVisible(false);
  };
  
  const handleAddExercise = () => {
    setCompletionSheetVisible(false);
    // Navigate to exercise selection
    navigation.navigate('MainTabs', { screen: 'Exercises' });
  };
  
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
    // Play sound and vibrate
    // playTimerCompleteSound();
    
    // Vibrate device
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Vibration.vibrate([0, 100, 200, 300]);
    }
    
    // Reset timer
    setRestTimer(prev => ({
      ...prev,
      isActive: false
    }));
    
    // Show alert
    Alert.alert('Rest Complete', 'Ready for your next set!');
  };
  
/*
  // Initialize sound effects
  const initSounds = async () => {
    try {
      await restTimerSound.loadAsync(require('../../../assets/sounds/timer-complete.mp3'));
    } catch (error) {
      console.error('Error loading sounds:', error);
    }
  };
  
  // Play timer complete sound
  const playTimerCompleteSound = async () => {
    try {
      await restTimerSound.setPositionAsync(0);
      await restTimerSound.playAsync();
    } catch (error) {
      console.error('Error playing timer sound:', error);
    }
  };
*/

const logWorkoutState = (label: string) => {
  if (!workout) return;
  
  console.log(`===== ${label} =====`);
  console.log(`Workout ID: ${workout.id}`);
  console.log(`Total exercises: ${workout.exercises.length}`);
  
  let totalSets = 0;
  let completedSets = 0;
  
  workout.exercises.forEach((exercise, i) => {
    totalSets += exercise.sets.length;
    const exCompletedSets = exercise.sets.filter(s => s.isComplete).length;
    completedSets += exCompletedSets;
    
    console.log(`Exercise ${i+1}: ${exercise.name} - ${exCompletedSets}/${exercise.sets.length} completed sets`);
    
    exercise.sets.forEach((set, j) => {
      console.log(`  Set ${j+1}: completed=${set.isComplete}, weight=${set.weight}, reps=${set.reps}`);
    });
  });
  
  console.log(`Total: ${completedSets}/${totalSets} sets completed`);
  console.log("================================");
};

  // Load workout data from route params or AsyncStorage
// In WorkoutTrackingScreen.tsx - Modify loadWorkoutData function

const loadWorkoutData = async () => {
  try {
    setLoading(true);
    
    // IMPORTANT: Add debug logging here
    console.log("🔍 WorkoutOverviewScreen: loadWorkoutData called");
    
    // Direct AsyncStorage check for debugging
    const asyncStorageWorkout = await AsyncStorage.getItem('current_workout');
    
    if (asyncStorageWorkout) {
      console.log("🔍 WorkoutOverviewScreen: Found existing workout in AsyncStorage, length:", 
        asyncStorageWorkout.length);
      
      try {
        // Parse the data before modifying anything
        const existingWorkout = JSON.parse(asyncStorageWorkout);
        
        // Count completed sets BEFORE we do anything
        const completedSets = existingWorkout.exercises.reduce((total, ex) => 
          total + (ex.sets?.filter(s => s.isComplete)?.length || 0), 0);
        
        console.log("🔍 WorkoutOverviewScreen: BEFORE PROCESSING - Workout has", 
          existingWorkout.exercises.length, "exercises and", 
          completedSets, "completed sets");
        
        // *** CRITICAL CHANGE: Don't modify the workout here, just use it as is ***
        setWorkout(existingWorkout);
        
        // Check if workout has been started
        const hasStarted = existingWorkout.exercises?.some(exercise => 
          exercise.sets?.some(set => set.isComplete)
        );
        setWorkoutStarted(hasStarted);
        
        console.log("🔍 WorkoutOverviewScreen: Loaded existing workout without modification");
      } catch (parseError) {
        console.error("🔍 WorkoutOverviewScreen: Error parsing workout:", parseError);
        createNewWorkout();
      }
    } else {
      console.log("🔍 WorkoutOverviewScreen: No workout found, creating new");
      createNewWorkout();
    }
  } catch (error) {
    console.error('🔍 WorkoutOverviewScreen: Error loading workout data:', error);
    createNewWorkout();
  } finally {
    setLoading(false);
  }
};
  
  // Helper function to create a new workout
  const createNewWorkout = async () => {
    console.log("🔍 WorkoutOverviewScreen: Creating new workout - THIS SHOULD ONLY HAPPEN WHEN NO WORKOUT EXISTS");
    
    const newWorkout: Workout = {
      id: Date.now().toString(),
      name: 'New Workout',
      exercises: [],
      status: 'not_started',
      startedAt: new Date().toISOString()
    };
    
    setWorkout(newWorkout);
    
    // Save through service (which handles AsyncStorage internally)
    await workoutService.saveCurrentWorkout(newWorkout);
    
    // Verify the save
    console.log("🔍 WorkoutOverviewScreen: New workout created with ID:", newWorkout.id);
  };
  
  // Save workout data
  const saveWorkoutData = async (): Promise<void> => {
    if (workout) {
      try {
        // Update workout duration if it was started
        if (workout.startedAt) {
          const startTime = new Date(workout.startedAt).getTime();
          const now = new Date().getTime();
          const durationInSeconds = Math.floor((now - startTime) / 1000);
          
          workout.duration = durationInSeconds;
        }
        
        // Save to service and await completion
        await workoutService.saveCurrentWorkout(workout);
        console.log('Workout data saved successfully');
      } catch (error) {
        console.error('Error saving workout data:', error);
        // Consider showing an alert here
      }
    }
  };

  // Add this function to ensure workout data is always saved after set changes
const ensureWorkoutSaved = async (updatedWorkout) => {
  try {
    // Create a deep copy to avoid reference issues
    const workoutToSave = JSON.parse(JSON.stringify(updatedWorkout));
    
    // Log the workout we're saving for debugging
    console.log("Saving workout with sets:", 
      workoutToSave.exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.map(s => ({id: s.id, isComplete: s.isComplete}))
      }))
    );
    
    // Save to AsyncStorage directly for maximum reliability
    await AsyncStorage.setItem('current_workout', JSON.stringify(workoutToSave));
    
    // Also save through service for consistency
    await workoutService.saveCurrentWorkout(workoutToSave);
    
    return true;
  } catch (error) {
    console.error("Error saving workout:", error);
    return false;
  }
};
  
  // Set up PanResponder for swipe gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        // Only allow panning if not editing text fields
        if (!editingWeight && !editingReps && !editingRPE && !isEditingNotes) {
          // Move the content horizontally with the finger
          position.setValue(gesture.dx);
        }
      },
      onPanResponderRelease: (event, gesture) => {
        // Only process swipe if not editing
        if (!editingWeight && !editingReps && !editingRPE && !isEditingNotes) {
          // Check if the swipe was strong enough
          if (gesture.dx < -SWIPE_THRESHOLD) {
            // Swipe left to go to next exercise
            handleNextExercise();
          } else if (gesture.dx > SWIPE_THRESHOLD) {
            // Swipe right to go to previous exercise
            handlePreviousExercise();
          } else {
            // Reset position if not swiped far enough
            Animated.spring(position, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        } else {
          // Reset position if editing
          Animated.spring(position, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

// Function to handle weight and reps updates with improved storage handling
const updateSetValue = async (setId: string, field: 'weight' | 'reps' | 'rpe', value: string | number) => {
  if (!workout) return;
  
  // Convert value to number or null
  const numValue = value === '' ? null : typeof value === 'number' ? value : parseFloat(value as string);
  
  try {
    // Create a deep copy of the current workout
    const workoutCopy = JSON.parse(JSON.stringify(workout));
    
    // Track if we found and updated the set
    let updatedSet = false;
    
    // Find and update the specific set
    for (const exercise of workoutCopy.exercises) {
      for (let i = 0; i < exercise.sets.length; i++) {
        if (exercise.sets[i].id === setId) {
          // Update only the specified field, preserve other values
          exercise.sets[i] = {
            ...exercise.sets[i],
            [field]: numValue
          };
          updatedSet = true;
          break;
        }
      }
      if (updatedSet) break;
    }
    
    if (!updatedSet) {
      console.error(`Set with ID ${setId} not found`);
      return;
    }
    
    // Update state
    setWorkout(workoutCopy);
    
    // DIRECT SAVE: Save directly to AsyncStorage for maximum reliability
    const workoutJson = JSON.stringify(workoutCopy);
    await AsyncStorage.setItem('current_workout', workoutJson);
    
    // Then also save through service
    await workoutService.saveCurrentWorkout(workoutCopy);
    
    console.log(`Successfully updated ${field} to ${numValue} for set ${setId}`);
    
  } catch (error) {
    console.error('Error updating set value:', error);
    Alert.alert('Error', 'Failed to save your progress');
  }
};
  
  // Function to check for personal records
// Function to check for personal records - modified to remove disruptive alerts
const checkForPersonalRecords = async () => {
  try {
    if (!workout) return;
    
    const currentExercise = workout.exercises[currentExerciseIndex];
    
    // Check for PRs
    const exerciseWithPRs = await workoutService.updatePersonalRecords(currentExercise);
    
    // Check if we have new PRs in the latest completed set
    const newPRs = exerciseWithPRs.sets.filter(set => set.isPR);
    
    if (newPRs.length > 0) {
      // Instead of showing an alert, just provide haptic feedback
      // and update the UI to show PR indicators
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Vibration.vibrate([0, 100, 50, 100, 50, 100]);
      }
      
      // Update the workout with PR flags only
      const updatedWorkout = { ...workout };
      updatedWorkout.exercises = [...workout.exercises];
      updatedWorkout.exercises[currentExerciseIndex] = {
        ...currentExercise,
        sets: currentExercise.sets.map((set, i) => {
          if (i < exerciseWithPRs.sets.length) {
            return { ...set, isPR: exerciseWithPRs.sets[i].isPR };
          }
          return set;
        })
      };
      
      // Update state and save
      setWorkout(updatedWorkout);
      await workoutService.saveCurrentWorkout(updatedWorkout);
      
      // Optionally, show a non-intrusive indicator
      // setShowPrConfetti(true);
      // setTimeout(() => setShowPrConfetti(false), 3000);
    }
  } catch (error) {
    console.error('Error checking for PRs:', error);
  }
};

// Function to mark a set as complete or incomplete
const toggleSetCompletion = async (setId: string) => {
  if (!workout) return;
  
  try {
    // Create a deep copy of the current workout
    const workoutCopy = JSON.parse(JSON.stringify(workout));
    
    // Track if we found and updated the set
    let updatedSet = false;
    let newCompletionState = false;
    
    // Find and update the specific set
    for (const exercise of workoutCopy.exercises) {
      for (let i = 0; i < exercise.sets.length; i++) {
        if (exercise.sets[i].id === setId) {
          // Toggle completion status
          newCompletionState = !exercise.sets[i].isComplete;
          
          // Update the set with toggled completion, preserving other fields
          exercise.sets[i] = {
            ...exercise.sets[i],
            isComplete: newCompletionState,
            completedAt: newCompletionState ? new Date().toISOString() : undefined
          };
          updatedSet = true;
          break;
        }
      }
      if (updatedSet) break;
    }
    
    if (!updatedSet) {
      console.error(`Set ${setId} not found`);
      return;
    }
    
    console.log(`Toggled set ${setId} completion to ${newCompletionState}`);
    
    // Update state FIRST
    setWorkout(workoutCopy);
    
    // DIRECT SAVE: Save directly to AsyncStorage first
    const workoutJson = JSON.stringify(workoutCopy);
    await AsyncStorage.setItem('current_workout', workoutJson);
    
    // Then save through service
    await workoutService.saveCurrentWorkout(workoutCopy);
    
    // Verify the save by reading it back
    const savedJson = await AsyncStorage.getItem('current_workout');
    if (savedJson) {
      const savedData = JSON.parse(savedJson);
      const totalCompletedSets = savedData.exercises.reduce((total, ex) => 
        total + ex.sets.filter(s => s.isComplete).length, 0);
      console.log(`Verified after toggle: ${totalCompletedSets} total completed sets`);
    }
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Vibration.vibrate(100);
    }
    
    // Only start rest timer if completing the set
    if (newCompletionState) {
      setLastCompletedSetId(setId);
    }
    
  } catch (error) {
    console.error('Error toggling set completion:', error);
    Alert.alert('Error', 'Failed to update set completion status');
  }
};
  
  // Function to add a new set to the current exercise
  const addSet = async () => {
    if (!workout) return;
    
    const currentExercise = workout.exercises[currentExerciseIndex];
    const lastSet = currentExercise.sets[currentExercise.sets.length - 1];
    const newSetNumber = currentExercise.sets.length + 1;
    
    // Create new set with values from the last set for convenience
    const newSet: ExerciseSet = {
      id: `${currentExercise.id}-set-${Date.now()}`, // Simpler ID format
      setNumber: newSetNumber,
      weight: lastSet?.weight || null,
      reps: lastSet?.reps || null,
      isComplete: false,
      rpe: lastSet?.rpe || null
    };
    
    // Create deep copy to avoid reference issues
    const workoutCopy = JSON.parse(JSON.stringify(workout));
    
    // Add the new set to the specific exercise
    workoutCopy.exercises = workoutCopy.exercises.map((exercise, index) => {
      if (index === currentExerciseIndex) {
        return {
          ...exercise,
          sets: [...exercise.sets, newSet]
        };
      }
      return exercise;
    });
    
    // Update state
    setWorkout(workoutCopy);
    
    // DIRECT SAVE: Save directly to AsyncStorage first
    const workoutJson = JSON.stringify(workoutCopy);
    await AsyncStorage.setItem('current_workout', workoutJson);
    
    // Then save through service
    await workoutService.saveCurrentWorkout(workoutCopy);
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Vibration.vibrate(50);
    }
  };
  
  // Function to remove a set
  const removeSet = async (setId: string) => {
    if (!workout) return;
    
    // Ask for confirmation
    Alert.alert(
      'Remove Set',
      'Are you sure you want to remove this set?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const currentExercise = workout.exercises[currentExerciseIndex];
            
            // Don't allow removing if there's only one set
            if (currentExercise.sets.length <= 1) {
              Alert.alert('Cannot Remove', 'You must have at least one set');
              return;
            }
            
            const updatedExercises = workout.exercises.map((exercise, index) => {
              if (index === currentExerciseIndex) {
                // Filter out the set to remove
                const updatedSets = exercise.sets.filter(set => set.id !== setId);
                
                // Renumber the remaining sets
                updatedSets.forEach((set, idx) => {
                  set.setNumber = idx + 1;
                });
                
                return {
                  ...exercise,
                  sets: updatedSets
                };
              }
              return exercise;
            });
            
            const newWorkout = { ...workout, exercises: updatedExercises };
            setWorkout(newWorkout);
            
            // Save workout data
            await workoutService.saveCurrentWorkout(newWorkout);
            
            // Provide haptic feedback
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            } else {
              Vibration.vibrate(100);
            }
          }
        }
      ]
    );
  };
  
  // Start or reset the rest timer
  const startRestTimer = (exerciseId: string, setId: string) => {
    // Clear any existing timer
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    
    // Get rest duration from exercise settings or use default
    const exercise = workout?.exercises[currentExerciseIndex];
    const restDuration = exercise?.restBetweenSets || restTimer.defaultDuration;
    
    setRestTimer({
      isActive: true,
      timeRemaining: restDuration,
      defaultDuration: restDuration,
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
  
  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
// Navigate to the previous exercise
const handlePreviousExercise = async () => {
  if (!workout) return;
  
  // Save current exercise notes
  await updateExerciseNotes();
  
  // Force save current workout data
  await saveWorkoutData();
  
  // Skip or stop any active timer
  skipRestTimer();
  
  Animated.timing(position, {
    toValue: width,
    duration: 250,
    useNativeDriver: true,
  }).start(() => {
    position.setValue(-width);
    
    if (currentExerciseIndex > 0) {
      const newIndex = currentExerciseIndex - 1;
      setCurrentExerciseIndex(newIndex);
      
      // Update notes for the new exercise
      setExerciseNotes(workout.exercises[newIndex].notes || '');
    } else {
      // If at the first exercise, go back to overview
      navigation.goBack();
      return;
    }
    
    Animated.timing(position, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  });
};

// Navigate to the next exercise
const handleNextExercise = async () => {
  if (!workout) return;
  
  // Create a deep copy of the current workout
  const workoutCopy = JSON.parse(JSON.stringify(workout));
  
  // Force immediate save before navigation
  await ensureWorkoutSaved(workoutCopy);
  
  // Skip any active timer
  skipRestTimer();
  
  Animated.timing(position, {
    toValue: -width,
    duration: 250,
    useNativeDriver: true,
  }).start(() => {
    position.setValue(width);
    
    if (currentExerciseIndex < workoutCopy.exercises.length - 1) {
      const newIndex = currentExerciseIndex + 1;
      setCurrentExerciseIndex(newIndex);
      
      // Update notes for the new exercise
      setExerciseNotes(workoutCopy.exercises[newIndex].notes || '');
    } else {
      // If at the last exercise, show completion modal
      setCompletionModalVisible(true);
      return;
    }
    
    Animated.timing(position, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  });
};

// Handle navigation back to overview screen
const handleBackToOverview = async () => {
  if (workout) {
    console.log("-----DEBUG: NAVIGATION BACK TO OVERVIEW-----");
    
    // Create a deep copy of the workout to see exactly what we're saving
    const workoutToSave = JSON.parse(JSON.stringify(workout));
    
    // Log the workout state explicitly with a structured format
    console.log(`DEBUG: Saving workout ID: ${workoutToSave.id}`);
    console.log(`DEBUG: Total exercises: ${workoutToSave.exercises.length}`);
    
    let totalSets = 0;
    let completedSets = 0;
    
    workoutToSave.exercises.forEach((ex, i) => {
      const exCompleted = ex.sets.filter(s => s.isComplete).length;
      totalSets += ex.sets.length;
      completedSets += exCompleted;
      
      console.log(`DEBUG: Exercise ${i+1}: ${ex.name} - ${exCompleted}/${ex.sets.length} completed sets`);
      
      // Log each set's details
      ex.sets.forEach((set, j) => {
        console.log(`DEBUG: Exercise ${i+1}, Set ${j+1}: ID=${set.id}, completed=${set.isComplete}, weight=${set.weight}, reps=${set.reps}`);
      });
    });
    
    console.log(`DEBUG: Total sets completed: ${completedSets}/${totalSets}`);
    
    try {
      // FIRST, directly save to AsyncStorage with error handling
      console.log("DEBUG: Directly saving to AsyncStorage first");
      try {
        await AsyncStorage.setItem('current_workout', JSON.stringify(workoutToSave));
        console.log("DEBUG: Direct AsyncStorage save successful");
      } catch (directError) {
        console.error("DEBUG: ERROR in direct AsyncStorage save:", directError);
      }
      
      // SECOND, save through the service layer
      console.log("DEBUG: Saving through workout service");
      await workoutService.saveCurrentWorkout(workoutToSave);
      
      // VERIFY the save was successful by reading back
      try {
        const verifyJson = await AsyncStorage.getItem('current_workout');
        if (verifyJson) {
          const verifiedWorkout = JSON.parse(verifyJson);
          const verifiedCompletedSets = verifiedWorkout.exercises.reduce((total, ex) => 
            total + ex.sets.filter(s => s.isComplete).length, 0);
          
          console.log(`DEBUG: Verification - saved workout has ${verifiedCompletedSets} completed sets`);
          
          // Compare expected vs actual
          if (completedSets !== verifiedCompletedSets) {
            console.error(`DEBUG: CRITICAL DATA MISMATCH - Expected ${completedSets} completed sets but found ${verifiedCompletedSets}`);
          } else {
            console.log("DEBUG: Data integrity verified ✓");
          }
        } else {
          console.error("DEBUG: VERIFICATION FAILED - Could not read workout from AsyncStorage");
        }
      } catch (verifyError) {
        console.error("DEBUG: ERROR during verification:", verifyError);
      }
    } catch (saveError) {
      console.error("DEBUG: ERROR saving workout:", saveError);
    }
    
    console.log("-----DEBUG: NAVIGATION COMPLETE-----");
  }
  
  // Wait a moment to ensure saves complete before navigation
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Navigate back
  navigation.goBack();
};
  
  // Update exercise notes
  const updateExerciseNotes = async () => {
    if (!workout) return;
    
    // Only update if notes have changed
    if (workout.exercises[currentExerciseIndex].notes !== exerciseNotes) {
      const updatedExercises = workout.exercises.map((exercise, index) => {
        if (index === currentExerciseIndex) {
          return {
            ...exercise,
            notes: exerciseNotes
          };
        }
        return exercise;
      });
      
      const newWorkout = { ...workout, exercises: updatedExercises };
      setWorkout(newWorkout);
      
      // Save workout data
      await workoutService.saveCurrentWorkout(newWorkout);
    }
    
    // Exit editing mode
    setIsEditingNotes(false);
  };
  
  // Calculate sets completed for current exercise
  const getCompletedSetsText = () => {
    if (!workout) return "";
    
    const currentExercise = workout.exercises[currentExerciseIndex];
    const completedSets = currentExercise.sets.filter(set => set.isComplete).length;
    const totalSets = currentExercise.sets.length;
    
    return `${completedSets} of ${totalSets} sets completed`;
  };
  
  // Handle completing the workout
  const completeWorkout = async () => {
    try {
      if (!workout) return;
      
      // Save any unsaved notes
      updateExerciseNotes();
      
      // Add completion timestamp and update status
      const completedWorkout = {
        ...workout,
        completedAt: new Date().toISOString(),
        status: 'completed' as const
      };
      
      // Calculate some stats for the workout
      let totalVolume = 0;
      let setCount = 0;
      let completedSetCount = 0;
      
      // Calculate total volume and completion rate
      completedWorkout.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          setCount++;
          if (set.isComplete) {
            completedSetCount++;
            if (set.weight && set.reps) {
              totalVolume += set.weight * set.reps;
            }
          }
        });
      });
      
      completedWorkout.totalVolume = totalVolume;
      
      // Add a check for workout completion
      if (completedSetCount === 0) {
        Alert.alert(
          'No Sets Completed',
          'You haven\'t completed any sets. Are you sure you want to finish this workout?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Complete Anyway',
              onPress: async () => {
                await finishWorkout(completedWorkout);
              }
            }
          ]
        );
      } else {
        await finishWorkout(completedWorkout);
      }
    } catch (error) {
      console.error('Error completing workout:', error);
      Alert.alert('Error', 'Failed to save workout data');
    }
  };
  
  // Final steps to finish a workout
  const finishWorkout = async (completedWorkout: Workout) => {
    try {
      // Use workout service to complete the workout
      await workoutService.completeWorkout(completedWorkout);
      
      // Explicitly clear the current workout
      await workoutService.clearCurrentWorkout();
      
      // Set a flag that a workout was recently completed
      await AsyncStorage.setItem('recently_completed_workout', 'true');
      
      // Navigate to a workout summary/success screen
      // For now, just go back to the main tabs
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      console.error('Error finishing workout:', error);
      Alert.alert('Error', 'Failed to complete workout');
    }
  };
  
  // Handle continuing the workout without completing
  const continueWorkout = () => {
    setCompletionModalVisible(false);
  };
  
  if (!workout || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }
  
  const currentExercise = workout.exercises[currentExerciseIndex];
  
  // Helper to find the next incomplete set (for highlighting the active set)
  const findNextIncompleteSetIndex = () => {
    return currentExercise.sets.findIndex(set => !set.isComplete);
  };
  
  // Get active set index
  const activeSetIndex = findNextIncompleteSetIndex();
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
{/* Header */}
<View style={styles.header}>
  <View style={styles.headerContent}>
    <TouchableOpacity onPress={handleBackToOverview}>
      <ArrowLeft size={24} color={colors.gray[900]} />
    </TouchableOpacity>
    
    <View style={styles.headerTitle}>
      <Text style={styles.headerText}>Exercise</Text>
      <Text style={styles.headerCount}>
        {currentExerciseIndex + 1} of {workout.exercises.length}
      </Text>
    </View>
    
    <TouchableOpacity>
      <MoreHorizontal size={24} color={colors.gray[900]} />
    </TouchableOpacity>
  </View>
</View>

      {/* Rest Timer Modal */}
      {restTimer.isActive && (
        <View style={styles.restTimerContainer}>
          <View style={styles.restTimerContent}>
            <Text style={styles.restTimerTitle}>Rest Timer</Text>
            <Text style={styles.restTimerTime}>{formatTime(restTimer.timeRemaining)}</Text>
            
            <ProgressBar 
              progress={restTimer.timeRemaining / restTimer.defaultDuration} 
              color="#4F46E5"
              style={styles.restTimerProgress}
            />
            
            <View style={styles.restTimerControls}>
              <TouchableOpacity style={styles.restTimerButton} onPress={skipRestTimer}>
                <Text style={styles.restTimerButtonText}>Skip</Text>
              </TouchableOpacity>
              
              {restTimer.isActive ? (
                <TouchableOpacity style={styles.restTimerButton} onPress={pauseRestTimer}>
                  <Pause size={20} color={colors.gray[900]} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.restTimerButton} onPress={resumeRestTimer}>
                  <Play size={20} color={colors.gray[900]} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.restTimerButton} 
                onPress={() => startRestTimer(restTimer.exerciseId!, restTimer.setId!)}
              >
                <RefreshCw size={20} color={colors.gray[900]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <Animated.ScrollView 
        style={[
          styles.scrollView,
          { transform: [{ translateX: position }] }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.content}>
          {/* Exercise Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.headlineContainer}>
              <Text style={styles.headline}>{currentExercise.name}</Text>
              <View style={styles.subtitleSection}>
                <Text style={styles.subtitle}>{getCompletedSetsText()}</Text>
                {/* Superset badge if applicable */}
                {currentExercise.supersetType && currentExercise.supersetType !== SupersetType.NONE && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{currentExercise.supersetType}</Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Notes section */}
            <View style={styles.noteContainer}>
              {isEditingNotes ? (
                <View style={styles.noteEditContainer}>
                  <TextInput
                    style={styles.noteEditInput}
                    value={exerciseNotes}
                    onChangeText={setExerciseNotes}
                    placeholder="Add notes for this exercise..."
                    multiline
                    autoFocus
                  />
                  <TouchableOpacity style={styles.noteSaveButton} onPress={updateExerciseNotes}>
                    <Save size={18} color="#4F46E5" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.noteDisplayContainer}
                  onPress={() => setIsEditingNotes(true)}
                >
                  <Text style={styles.noteText}>
                    {exerciseNotes || "Tap to add notes..."}
                  </Text>
                  <Edit size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Sets Section */}
          <View style={styles.setsSection}>
            {/* Sets table header */}
            <View style={styles.setTableHeader}>
              <Text style={styles.setTableHeaderText}>SET</Text>
              <Text style={styles.setTableHeaderText}>PREV</Text>
              <Text style={styles.setTableHeaderText}>KG</Text>
              <Text style={styles.setTableHeaderText}>REPS</Text>
              <Text style={styles.setTableHeaderText}>RPE</Text>
              <Text style={styles.setTableHeaderText}>✓</Text>
            </View>
            
            {currentExercise.sets.map((set, index) => {
              // Determine if set should be active or inactive
              const isActive = index === activeSetIndex;
              const isInactive = index > activeSetIndex && activeSetIndex !== -1;
              
              // Animation for the last completed set
              const isLastCompleted = set.id === lastCompletedSetId;
              
              return (
                <Animated.View 
                  key={set.id} 
                  style={[
                    styles.setRow, 
                    isActive && styles.activeSetRow,
                    isInactive && styles.inactiveSetRow,
                    isLastCompleted && {
                      backgroundColor: setCompleteAnimation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: ['#FCFDFD', '#E0F2FE', '#FCFDFD']
                      })
                    }
                  ]}
                >
                  <View style={styles.setRowContent}>
                    {/* Set number */}
                    <View style={styles.setNumberContainer}>
                      <Text style={[styles.setNumber, isInactive && styles.inactiveText]}>
                        {String(set.setNumber).padStart(2, '0')}
                      </Text>
                    </View>
                    
                    {/* Previous performance */}
                    <View style={styles.previousContainer}>
                      {set.previousWeight && set.previousReps ? (
                        <Text style={[styles.previousText, isInactive && styles.inactiveText]}>
                          {set.previousWeight}kg × {set.previousReps}
                        </Text>
                      ) : (
                        <Text style={[styles.previousText, styles.emptyValue, isInactive && styles.inactiveText]}>
                          -
                        </Text>
                      )}
                    </View>
                    
                    {/* Weight */}
                    <View style={styles.weightContainer}>
  {editingWeight && editingWeight.setId === set.id ? (
    <TextInput
      style={styles.valueInput}
      value={editingWeight.value}
      onChangeText={(text) => setEditingWeight({...editingWeight, value: text})}
      keyboardType="numeric"
      autoFocus
      onBlur={() => {
        updateSetValue(set.id, 'weight', editingWeight.value);
        setEditingWeight(null);
      }}
      onSubmitEditing={() => {
        updateSetValue(set.id, 'weight', editingWeight.value);
        setEditingWeight(null);
      }}
    />
  ) : (
    <TouchableOpacity
      onPress={() => setEditingWeight({setId: set.id, value: set.weight?.toString() || ''})}
      disabled={isInactive}
    >
      <Text style={[
        styles.weightValue, 
        !set.weight && styles.emptyValue,
        isInactive && styles.inactiveText,
        // Add a visual indicator if value is saved but set not completed
        (set.weight && !set.isComplete) && styles.savedButNotCompletedText
      ]}>
        {set.weight?.toString() || '-'}
      </Text>
    </TouchableOpacity>
  )}
</View>
                    
                    {/* Reps */}
                    <View style={styles.repsContainer}>
                      {editingReps && editingReps.setId === set.id ? (
                        <TextInput
                          style={styles.valueInput}
                          value={editingReps.value}
                          onChangeText={(text) => setEditingReps({...editingReps, value: text})}
                          keyboardType="numeric"
                          autoFocus
                          onBlur={() => {
                            updateSetValue(set.id, 'reps', editingReps.value);
                            setEditingReps(null);
                          }}
                          onSubmitEditing={() => {
                            updateSetValue(set.id, 'reps', editingReps.value);
                            setEditingReps(null);
                          }}
                        />
                      ) : (
                        <TouchableOpacity
                          onPress={() => setEditingReps({setId: set.id, value: set.reps?.toString() || ''})}
                          disabled={isInactive}
                        >
                          <Text style={[
                            styles.repsValue, 
                            !set.reps && styles.emptyValue,
                            isInactive && styles.inactiveText
                          ]}>
                            {set.reps?.toString() || '-'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* RPE (Rate of Perceived Exertion) */}
                    <View style={styles.rpeContainer}>
                      {editingRPE && editingRPE.setId === set.id ? (
                        <Slider
                          style={styles.rpeSlider}
                          value={editingRPE.value || 5}
                          minimumValue={1}
                          maximumValue={10}
                          step={0.5}
                          minimumTrackTintColor="#4F46E5"
                          maximumTrackTintColor="#E5E7EB"
                          onValueChange={(value) => setEditingRPE({...editingRPE, value})}
                          onSlidingComplete={(value) => {
                            updateSetValue(set.id, 'rpe', value);
                            setEditingRPE(null);
                          }}
                        />
                      ) : (
                        <TouchableOpacity
                          onPress={() => setEditingRPE({setId: set.id, value: set.rpe})}
                          disabled={isInactive || !set.isComplete}
                        >
                          <Text style={[
                            styles.rpeValue, 
                            !set.rpe && styles.emptyValue,
                            isInactive && styles.inactiveText,
                            !set.isComplete && styles.disabledText
                          ]}>
                            {set.rpe?.toString() || '-'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* Completion checkbox / PR indicator */}
                    <View style={styles.completionContainer}>
                      {set.isPR ? (
                        <View style={styles.prContainer}>
                          <Award size={20} color="#F59E0B" />
                        </View>
                      ) : (
                        <TouchableOpacity 
                          onPress={() => toggleSetCompletion(set.id)}
                          disabled={isInactive}
                          style={[
                            styles.completionCheckbox,
                            set.isComplete && styles.completedCheckbox,
                            isInactive && styles.disabledCheckbox
                          ]}
                        >
                          {set.isComplete && (
                            <Check size={16} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      )}
                      
                      {/* Set menu button for additional actions */}
                      <TouchableOpacity 
                        style={styles.setMenuButton}
                        onPress={() => removeSet(set.id)}
                      >
                        <Trash size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  </Animated.View>
              );
            })}
          </View>

          {/* Add Set Button */}
          <View style={styles.addSetContainer}>
            <TouchableOpacity style={styles.addSetButton} onPress={addSet}>
              <Text style={styles.addSetText}>Add set</Text>
              <Plus size={20} color="#374151" />
            </TouchableOpacity>
          </View>
          
          {/* Exercise History Section (toggleable) */}
          <View style={styles.historySection}>
            <TouchableOpacity 
              style={styles.historySectionHeader}
              onPress={() => setShowExerciseHistory(!showExerciseHistory)}
            >
              <Text style={styles.historySectionTitle}>Exercise History</Text>
              {showExerciseHistory ? (
                <ChevronUp size={20} color={colors.gray[900]} />
              ) : (
                <ChevronDown size={20} color={colors.gray[900]} />
              )}
            </TouchableOpacity>
            
            {showExerciseHistory && (
              <View style={styles.historyContent}>
                {currentExercise.exerciseHistory?.length ? (
                  currentExercise.exerciseHistory.map((record, idx) => (
                    <View key={idx} style={styles.historyItem}>
                      <Text style={styles.historyDate}>{new Date(record.date).toLocaleDateString()}</Text>
                      <Text style={styles.historyWeight}>{record.weight}kg</Text>
                      <Text style={styles.historyReps}>{record.reps} reps</Text>
                      <Text style={styles.historyVolume}>{record.volume}kg</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noHistoryText}>No previous data for this exercise</Text>
                )}
              </View>
            )}
          </View>
          
          {/* Exercise Information Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Exercise Information</Text>
              <Text style={styles.infoDescription}>
                {currentExercise.primaryMuscles} • {currentExercise.equipment}
              </Text>
              
              {/* Exercise target muscle groups */}
              {currentExercise.targetMuscleGroups && currentExercise.targetMuscleGroups.length > 0 && (
                <View style={styles.muscleTags}>
                  {currentExercise.targetMuscleGroups.map((muscle, idx) => (
                    <View key={idx} style={styles.muscleTag}>
                      <Text style={styles.muscleTagText}>{muscle}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
          
          {/* Estimated One-Rep Max */}
          <View style={styles.oneRepMaxSection}>
            <View style={styles.oneRepMaxCard}>
              <Text style={styles.oneRepMaxTitle}>Estimated 1RM</Text>
              <Text style={styles.oneRepMaxValue}>
                {currentExercise.estimatedOneRepMax ? 
                  `${Math.round(currentExercise.estimatedOneRepMax)}kg` : 
                  'Complete a set to calculate'
                }
              </Text>
            </View>
          </View>
          
          {/* Bottom padding for floating button */}
          <View style={styles.bottomPadding} />
        </View>
      </Animated.ScrollView>
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Info size={24} color="#FCFDFD" />
            <Text style={styles.navText}>Guide</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Activity size={24} color="#FCFDFD" />
            <Text style={styles.navText}>Stats</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Timer size={24} color="#FCFDFD" />
            <Text style={styles.navText}>Timer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => setIsEditingNotes(true)}
          >
            <FileText size={24} color="#FCFDFD" />
            <Text style={styles.navText}>Notes</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Workout Completion Modal */}
      <Portal>
        <Modal
          visible={completionModalVisible}
          onDismiss={() => setCompletionModalVisible(false)}
          contentContainerStyle={styles.completionModal}
        >
          <Text style={styles.completionTitle}>Workout Complete</Text>
          <Text style={styles.completionSubtitle}>
            You've reached the end of your workout. What would you like to do?
          </Text>
          
          <View style={styles.completionButtons}>
            <Button
              mode="contained"
              style={styles.completeButton}
              onPress={completeWorkout}
            >
              Complete Workout
            </Button>
            
            <Button
              mode="outlined"
              style={styles.continueButton}
              onPress={continueWorkout}
            >
              Continue Workout
            </Button>
          </View>
        </Modal>
      </Portal>
      
      {/* PR Confetti animation would go here */}
      {showPrConfetti && (
        <View style={styles.prConfettiContainer}>
          {/* Animated confetti elements */}
          <View style={styles.prBanner}>
            <Award size={32} color="#F59E0B" />
            <Text style={styles.prBannerText}>New Personal Record!</Text>
          </View>
        </View>
      )}

{/* Completion Bottom Sheet */}
<Portal>
  <Modal
    visible={completionSheetVisible}
    onDismiss={() => setCompletionSheetVisible(false)}
    contentContainerStyle={styles.completionModal}
  >
    <View style={styles.completionSheetContainer}>
      <Text style={styles.completionSheetTitle}>Exercise Complete!</Text>
      <Text style={styles.completionSheetSubtitle}>All sets for this exercise are completed</Text>
      
      <View style={styles.completionButtonsContainer}>
        <TouchableOpacity style={styles.completionButton} onPress={handleAddMoreSets}>
          <Plus size={18} color={colors.gray[900]} />
          <Text style={styles.completionButtonText}>Add more sets</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.completionButton} onPress={handleGoToNextExercise}>
          {/* Fix for ChevronRightMini */}
          <ChevronRightMini width={18} height={18} stroke={colors.gray[900]} />
          <Text style={styles.completionButtonText}>Next exercise</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.completionButton} onPress={handleContinueEditing}>
          <Edit size={18} color={colors.gray[900]} />
          <Text style={styles.completionButtonText}>Continue editing</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.completionButton} onPress={handleAddExercise}>
          <Plus size={18} color={colors.gray[900]} />
          <Text style={styles.completionButtonText}>Add exercise</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
</Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#4B5563',
  },
  header: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    borderBottomWidth: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#9CA3AF',
  },
  headerCount: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.gray[900],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 0,
    paddingBottom: 120,
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingBottom: 0,
    marginBottom: 16,
  },
  headlineContainer: {
    marginBottom: 8,
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 36,
    color: colors.gray[900],
    marginBottom: 0,
  },
  subtitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 26,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#9CA3AF',
  },
  badge: {
    backgroundColor: colors.gray[900],
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FCFDFD',
    fontFamily: fonts.medium,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  noteContainer: {
    minHeight: 32,
    justifyContent: 'center',
    marginTop: 8,
  },
  noteDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  noteEditContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  noteEditInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.gray[900],
  },
  noteSaveButton: {
    padding: 16,
  },
  noteText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
  },
  setsSection: {
    marginBottom: 16,
  },
  setTableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: colors.gray[50],
  },
  setTableHeaderText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  setRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activeSetRow: {
    backgroundColor: colors.gray[50],
  },
  inactiveSetRow: {
    backgroundColor: 'transparent',
    opacity: 0.7,
  },
  setRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
  },
  setNumberContainer: {
    width: 30,
    alignItems: 'center',
  },
  setNumber: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.gray[900],
  },
  previousContainer: {
    width: 60,
    alignItems: 'center',
  },
  previousText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  weightContainer: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightValue: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.gray[900],
    textAlign: 'center',
  },
  repsContainer: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repsValue: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.gray[900],
    textAlign: 'center',
  },
  rpeContainer: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rpeValue: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.gray[900],
    textAlign: 'center',
  },
  rpeSlider: {
    width: 100,
    height: 40,
    position: 'absolute',
    right: -30,
  },
  valueInput: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.gray[900],
    textAlign: 'center',
    width: 45,
    padding: 0,
  },
  completionContainer: {
    width: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCheckbox: {
    backgroundColor: colors.indigo[600],
    borderColor: '#4F46E5',
  },
  disabledCheckbox: {
    borderColor: '#D1D5DB',
  },
  setMenuButton: {
    padding: 4,
  },
  emptyValue: {
    color: '#9CA3AF',
  },
  inactiveText: {
    color: colors.gray[300],
  },
  disabledText: {
    color: colors.gray[300],
  },
  prContainer: {
    marginRight: 4,
  },
  addSetContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  addSetText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#374151',
  },
  historySection: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  historySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historySectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.gray[900],
  },
  historyContent: {
    padding: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyDate: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#4B5563',
  },
  historyWeight: {
    width: 60,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.gray[900],
    textAlign: 'center',
  },
  historyReps: {
    width: 60,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.gray[900],
    textAlign: 'center',
  },
  historyVolume: {
    width: 60,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.gray[900],
    textAlign: 'center',
  },
  noHistoryText: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#6B7280',
    padding: 16,
  },
  infoSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.gray[900],
    marginBottom: 8,
  },
  infoDescription: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  muscleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  muscleTag: {
    backgroundColor: colors.gray[100],
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  muscleTagText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#4B5563',
  },
  oneRepMaxSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  oneRepMaxCard: {
    backgroundColor: colors.indigo[600],
    borderRadius: 8,
    padding: 16,
  },
  oneRepMaxTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#E0E7FF',
    marginBottom: 4,
  },
  oneRepMaxValue: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: '#FFFFFF',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.gray[900],
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 16,
  },
  navItem: {
    alignItems: 'center',
    width: 60,
    gap: 6,
  },
  navText: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: '#FCFDFD',
    textAlign: 'center',
  },
  completionModal: {
    backgroundColor: colors.common.white,
    padding: 20,
    marginHorizontal: 30,
    borderRadius: 12,
  },
  completionTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.gray[900],
    marginBottom: 12,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  completionButtons: {
    gap: 12,
  },
  completeButton: {
    backgroundColor: colors.indigo[600],
    paddingVertical: 8,
  },
  continueButton: {
    borderColor: '#6B7280',
  },
  bottomPadding: {
    height: 100,
  },
  restTimerContainer: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    zIndex: 20,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  restTimerContent: {
    padding: 16,
  },
  restTimerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
    textAlign: 'center',
  },
  restTimerTime: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  restTimerProgress: {
    height: 6,
    borderRadius: 3,
    marginBottom: 16,
  },
  restTimerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  restTimerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  restTimerButtonText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.gray[900],
  },
  prConfettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  prBanner: {
    backgroundColor: colors.common.white,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  prBannerText: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.gray[900],
  },
  savedButNotCompletedText: {
    color: '#4F46E5', // Use a different color to show it's saved but not completed
    fontStyle: 'normal',
  },
  completionSheetContainer: {
    flex: 1,
    padding: 16,
  },
  completionSheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  completionSheetSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  completionButtonsContainer: {
    gap: 12,
  },
  completionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.common.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  completionButtonText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.gray[900],
  },
});