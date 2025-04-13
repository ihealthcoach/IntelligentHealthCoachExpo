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
  Platform
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
import {
  Workout,
  WorkoutExercise,
  ExerciseSet,
  SupersetType
} from '../../types/workout';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';

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
      
      // Save workout data when unmounting
      saveWorkoutData();
    };
  }, []);
  
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

  // Load workout data from route params or AsyncStorage
  const loadWorkoutData = async () => {
    try {
      setLoading(true);
      
      // Get the starting exercise index from route params (default to 0)
      const startIndex = route.params?.exerciseIndex || 0;
      setCurrentExerciseIndex(startIndex);
      
      // Try to get workout data from route params first
      if (route.params?.workout) {
        setWorkout(route.params.workout);
        
        // Set notes for the current exercise
        if (route.params.workout.exercises[startIndex]) {
          setExerciseNotes(route.params.workout.exercises[startIndex].notes || '');
        }
      } else {
        // Otherwise load from AsyncStorage via our service
        const currentWorkout = await workoutService.getCurrentWorkout();
        if (currentWorkout) {
          setWorkout(currentWorkout);
          
          // Set notes for the current exercise
          if (currentWorkout.exercises[startIndex]) {
            setExerciseNotes(currentWorkout.exercises[startIndex].notes || '');
          }
        } else {
          Alert.alert('Error', 'No workout data found');
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Error loading workout data:', error);
      Alert.alert('Error', 'Failed to load workout data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };
  
  // Save workout data
  const saveWorkoutData = async () => {
    if (workout) {
      try {
        // Update workout duration if it was started
        if (workout.startedAt) {
          const startTime = new Date(workout.startedAt).getTime();
          const now = new Date().getTime();
          const durationInSeconds = Math.floor((now - startTime) / 1000);
          
          workout.duration = durationInSeconds;
        }
        
        // Save to service
        await workoutService.saveCurrentWorkout(workout);
        console.log('Workout data saved successfully');
      } catch (error) {
        console.error('Error saving workout data:', error);
      }
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

  // Function to handle weight and reps updates
  const updateSetValue = async (setId: string, field: 'weight' | 'reps' | 'rpe', value: string | number) => {
    if (!workout) return;
    
    let numValue: number | null = null;
    
    // Handle different types of values
    if (field === 'rpe') {
      numValue = typeof value === 'number' ? value : (value === '' ? null : parseFloat(value as string));
    } else {
      numValue = value === '' ? null : parseFloat(value as string);
    }
    
    const updatedExercises = workout.exercises.map((exercise, index) => {
      if (index === currentExerciseIndex) {
        const updatedSets = exercise.sets.map(set => {
          if (set.id === setId) {
            const updatedSet: ExerciseSet = { ...set, [field]: numValue };
            
            // Store previous values for comparison if completing the set
            if (field === 'weight' || field === 'reps') {
              if (set.isComplete) {
                // Already completed, just update the value
                return updatedSet;
              }
              
              // Automatically mark as complete if both weight and reps have values
              const otherField = field === 'weight' ? 'reps' : 'weight';
              const otherValue = field === 'weight' ? updatedSet.reps : updatedSet.weight;
              
              if (numValue !== null && otherValue !== null) {
                updatedSet.isComplete = true;
                updatedSet.completedAt = new Date().toISOString();
                
                // Set this as the last completed set for animation
                setLastCompletedSetId(setId);
                
                // Trigger completion animation
                setCompleteAnimation.setValue(0);
                Animated.timing(setCompleteAnimation, {
                  toValue: 1,
                  duration: 500,
                  useNativeDriver: true,
                }).start();
                
                // Provide haptic feedback for set completion
                if (Platform.OS === 'ios') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } else {
                  Vibration.vibrate(100);
                }
                
                // Start rest timer if set is completed
                startRestTimer(exercise.id, setId);
              }
            }
            
            return updatedSet;
          }
          return set;
        });
        
        // Check for personal records after updating
        const updatedExercise = { ...exercise, sets: updatedSets };
        return updatedExercise;
      }
      return exercise;
    });
    
    const newWorkout = { ...workout, exercises: updatedExercises };
    setWorkout(newWorkout);
    
    // Save workout data after update
    await workoutService.saveCurrentWorkout(newWorkout);
    
    // Check for PRs
    checkForPersonalRecords();
  };
  
  // Function to check for personal records
  /*
  const checkForPersonalRecords = async () => {
    try {
      if (!workout) return;
      
      const currentExercise = workout.exercises[currentExerciseIndex];
      
      // Check for PRs
      const exerciseWithPRs = await workoutService.updatePersonalRecords(currentExercise);
      
      // Check if we have new PRs in the latest completed set
      const newPRs = exerciseWithPRs.sets.filter(set => set.isPR);
      
      if (newPRs.length > 0) {
        // Show native alert for PR
        Alert.alert(
          "New Personal Record! 🏆",
          "Congratulations! You've set a new personal record.",
          [{ text: "Dismiss", style: "default" }],
          { cancelable: true }
        );
        
        // Provide strong haptic feedback
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
      }
    } catch (error) {
      console.error('Error checking for PRs:', error);
    }
  };
  */
  // Function to mark a set as complete or incomplete
  const toggleSetCompletion = async (setId: string) => {
    if (!workout) return;
    
    const updatedExercises = workout.exercises.map((exercise, index) => {
      if (index === currentExerciseIndex) {
        const updatedSets = exercise.sets.map(set => {
          if (set.id === setId) {
            const wasComplete = set.isComplete;
            const newState = !wasComplete;
            
            // If marking complete, record completion time
            const updatedSet = { 
              ...set, 
              isComplete: newState, 
              completedAt: newState ? new Date().toISOString() : undefined
            };
            
            // If completing, set as last completed and start timer
            if (newState) {
              setLastCompletedSetId(setId);
              startRestTimer(exercise.id, setId);
              
              // Provide haptic feedback
              if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else {
                Vibration.vibrate(100);
              }
            }
            
            return updatedSet;
          }
          return set;
        });
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    });
    
    const newWorkout = { ...workout, exercises: updatedExercises };
    setWorkout(newWorkout);
    
  // Save workout data
  await workoutService.saveCurrentWorkout(newWorkout);
  
  // Only check for PRs after completing a set, not when uncompleting
  const setJustCompleted = updatedExercises[currentExerciseIndex].sets.find(s => s.id === setId)?.isComplete;
  if (setJustCompleted) {
    // Check for PRs with a slight delay to ensure state is updated
    setTimeout(() => checkForPersonalRecords(), 500);
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
      id: `${currentExercise.id}-set-${Date.now()}`,
      setNumber: newSetNumber,
      weight: lastSet?.weight || null,
      reps: lastSet?.reps || null,
      isComplete: false,
      rpe: lastSet?.rpe || null
    };
    
    const updatedExercises = workout.exercises.map((exercise, index) => {
      if (index === currentExerciseIndex) {
        return {
          ...exercise,
          sets: [...exercise.sets, newSet]
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
  const handlePreviousExercise = () => {
    if (!workout) return;
    
    // Save current exercise notes
    updateExerciseNotes();
    
    // Force save current workout data
    saveWorkoutData();
    
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
  const handleNextExercise = () => {
    if (!workout) return;
    
    // Save current exercise notes
    updateExerciseNotes();
    
    // Force save current workout data
    saveWorkoutData();
    
    // Skip or stop any active timer
    skipRestTimer();
    
    Animated.timing(position, {
      toValue: -width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      position.setValue(width);
      
      if (currentExerciseIndex < workout.exercises.length - 1) {
        const newIndex = currentExerciseIndex + 1;
        setCurrentExerciseIndex(newIndex);
        
        // Update notes for the new exercise
        setExerciseNotes(workout.exercises[newIndex].notes || '');
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerText}>Exercise</Text>
            <Text style={styles.headerCount}>
              {currentExerciseIndex + 1} of {workout.exercises.length}
            </Text>
          </View>
          
          <TouchableOpacity>
            <MoreHorizontal size={24} color="#111827" />
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
                  <Pause size={20} color="#111827" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.restTimerButton} onPress={resumeRestTimer}>
                  <Play size={20} color="#111827" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.restTimerButton} 
                onPress={() => startRestTimer(restTimer.exerciseId!, restTimer.setId!)}
              >
                <RefreshCw size={20} color="#111827" />
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
                            isInactive && styles.inactiveText
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
                <ChevronUp size={20} color="#111827" />
              ) : (
                <ChevronDown size={20} color="#111827" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    fontSize: 16,
    color: '#4B5563',
  },
  header: {
    backgroundColor: '#F3F4F6',
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
    fontSize: 16,
    color: '#9CA3AF',
  },
  headerCount: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
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
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 0,
  },
  subtitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 26,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  badge: {
    backgroundColor: '#111827',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FCFDFD',
    fontSize: 14,
    fontWeight: '500',
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
    backgroundColor: '#FCFDFD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  noteEditInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  noteSaveButton: {
    padding: 16,
  },
  noteText: {
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
    backgroundColor: '#F9FAFB',
  },
  setTableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: '#FCFDFD',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  previousContainer: {
    width: 60,
    alignItems: 'center',
  },
  previousText: {
    fontSize: 12,
    color: '#6B7280',
  },
  weightContainer: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightValue: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  repsContainer: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repsValue: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  rpeContainer: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rpeValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  rpeSlider: {
    width: 100,
    height: 40,
    position: 'absolute',
    right: -30,
  },
  valueInput: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
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
    backgroundColor: '#4F46E5',
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
    color: '#D1D5DB',
  },
  disabledText: {
    color: '#D1D5DB',
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
    backgroundColor: '#FCFDFD',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  addSetText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  historySection: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#FCFDFD',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
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
    fontSize: 14,
    color: '#4B5563',
  },
  historyWeight: {
    width: 60,
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
  },
  historyReps: {
    width: 60,
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
  },
  historyVolume: {
    width: 60,
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
  },
  noHistoryText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    padding: 16,
  },
  infoSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#FCFDFD',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoDescription: {
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
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  muscleTagText: {
    fontSize: 12,
    color: '#4B5563',
  },
  oneRepMaxSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  oneRepMaxCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    padding: 16,
  },
  oneRepMaxTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E0E7FF',
    marginBottom: 4,
  },
  oneRepMaxValue: {
    fontSize: 24,
    fontWeight: '700',
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
    backgroundColor: '#111827',
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
    fontSize: 9,
    color: '#FCFDFD',
    textAlign: 'center',
  },
  completionModal: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 30,
    borderRadius: 12,
  },
  completionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  completionButtons: {
    gap: 12,
  },
  completeButton: {
    backgroundColor: '#4F46E5',
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
    backgroundColor: '#FCFDFD',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
    textAlign: 'center',
  },
  restTimerTime: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
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
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  restTimerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
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
    backgroundColor: '#FFFFFF',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  }
});