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
  Vibration,
  Platform,
  Keyboard,
} from 'react-native';
import { 
  Check, 
  Plus, 
  ArrowLeft, 
  MoreHorizontal, 
  Info, 
  Activity,
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

// Components
import SetKeyboardWrapper from '../../components/workout/SetKeyboardWrapper';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

// Import Icons
import Icon from '../../components/Icons';
import { IconName } from '../../components/Icons';
import ChevronRightMini from '../../assets/icons/chevron-right-mini.svg';

// Get screen dimensions for swipe calculations
const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120; // Minimum distance required for a swipe

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
  
  // Set logging state - NEW
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [activeSetWeight, setActiveSetWeight] = useState('');
  const [activeSetReps, setActiveSetReps] = useState('');
  const [activeSetType, setActiveSetType] = useState('standard');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const hiddenInputRef = useRef<TextInput>(null);
  
  // Set editing state (original functionality)
  const [editingWeight, setEditingWeight] = useState<{setId: string, value: string} | null>(null);
  const [editingReps, setEditingReps] = useState<{setId: string, value: string} | null>(null);
  const [editingRPE, setEditingRPE] = useState<{setId: string, value: number | null} | null>(null);
  
  // Rest timer state
  const [restTimer, setRestTimer] = useState({
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

  // NEW: Add keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
      
      Animated.timing(position, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  
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
  
  // Helper to find the next incomplete set (for highlighting the active set)
  const findNextIncompleteSetIndex = () => {
    if (!workout) return -1;
    const currentExercise = workout.exercises[currentExerciseIndex];
    return currentExercise.sets.findIndex(set => !set.isComplete);
  };
  
  if (!workout || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }
  
  const currentExercise = workout.exercises[currentExerciseIndex];
  
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

          {/* Add Set Button */}
          <View style={styles.addSetContainer}>
            <TouchableOpacity style={styles.addSetButton} onPress={addSet}>
              <Text style={styles.addSetText}>Add set</Text>
              <Plus size={20} color="#374151" />
            </TouchableOpacity>
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
                  {/* Touchable wrapper for the entire row to select for logging */}
                  <TouchableOpacity 
                    style={styles.setRowContent}
                    onPress={() => handleSetSelection(set)}
                    activeOpacity={0.8}
                  >
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
                        <Text style={[
                          styles.weightValue, 
                          !set.weight && styles.emptyValue,
                          isInactive && styles.inactiveText,
                          // Add a visual indicator if value is saved but set not completed
                          (set.weight && !set.isComplete) && styles.savedButNotCompletedText
                        ]}>
                          {set.weight?.toString() || '-'}
                        </Text>
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
                        <Text style={[
                          styles.repsValue, 
                          !set.reps && styles.emptyValue,
                          isInactive && styles.inactiveText
                        ]}>
                          {set.reps?.toString() || '-'}
                        </Text>
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
                        <Text style={[
                          styles.rpeValue, 
                          !set.rpe && styles.emptyValue,
                          isInactive && styles.inactiveText,
                          !set.isComplete && styles.disabledText
                        ]}>
                          {set.rpe?.toString() || '-'}
                        </Text>
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
                          style={[
                            styles.completionCheckbox,
                            set.isComplete && styles.completedCheckbox,
                            isInactive && styles.disabledCheckbox
                          ]}
                          onPress={() => toggleSetCompletion(set.id)}
                          disabled={isInactive}
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
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
      )}

      {/* Hidden TextInput to trigger keyboard */}
      <TextInput
        ref={hiddenInputRef}
        style={{ height: 0, width: 0, opacity: 0 }}
        onFocus={() => setKeyboardVisible(true)}
      />

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
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setActiveSetId(null);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Load workout data when the component mounts
  useEffect(() => {
    loadWorkoutData();
    
    return () => {
      // Clean up any timers
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      
      // Save workout data when unmounting
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
  
  // NEW: Function to handle selecting a set for logging
  const handleSetSelection = (set) => {
    // If already selecting this set, do nothing
    if (activeSetId === set.id) return;
    
    // Close any existing editing state
    setEditingWeight(null);
    setEditingReps(null);
    setEditingRPE(null);
    
    // Set this as the active set for logging
    setActiveSetId(set.id);
    setActiveSetWeight(set.weight?.toString() || '');
    setActiveSetReps(set.reps?.toString() || '');
    setActiveSetType(set.type || 'standard');
    
    // Focus hidden input to trigger keyboard
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  };

  // NEW: Function to save the active set
  const saveActiveSet = async () => {
    if (!workout || !activeSetId) return;
    
    try {
      // Create a deep copy of the current workout
      const workoutCopy = JSON.parse(JSON.stringify(workout));
      
      // Find the active set and update its values
      let updatedSet = false;
      let updatedSetObject = null;
      
      for (const exercise of workoutCopy.exercises) {
        for (let i = 0; i < exercise.sets.length; i++) {
          if (exercise.sets[i].id === activeSetId) {
            // Update the set with new values
            exercise.sets[i] = {
              ...exercise.sets[i],
              weight: activeSetWeight ? parseFloat(activeSetWeight) : null,
              reps: activeSetReps ? parseInt(activeSetReps, 10) : null,
              type: activeSetType,
              isComplete: true,
              completedAt: new Date().toISOString()
            };
            updatedSet = true;
            updatedSetObject = exercise.sets[i];
            break;
          }
        }
        if (updatedSet) break;
      }
      
      if (!updatedSet) {
        console.error(`Set with ID ${activeSetId} not found`);
        return;
      }
      
      // Update state
      setWorkout(workoutCopy);
      
      // Save directly to AsyncStorage
      await AsyncStorage.setItem('current_workout', JSON.stringify(workoutCopy));
      
      // Also save through service
      await workoutService.saveCurrentWorkout(workoutCopy);
      
      // Provide feedback
      setLastCompletedSetId(activeSetId);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Vibration.vibrate(100);
      }
      
      // Start rest timer
      if (updatedSetObject) {
        startRestTimer(
          workout.exercises[currentExerciseIndex].id, 
          updatedSetObject.id
        );
      }
      
      // Reset active set
      setActiveSetId(null);
      
      // Check for PRs
      checkForPersonalRecords();
      
      // Dismiss keyboard
      Keyboard.dismiss();
      
    } catch (error) {
      console.error('Error saving set:', error);
      Alert.alert('Error', 'Failed to save the set');
    }
  };
  
  // Load workout data from AsyncStorage
  const loadWorkoutData = async () => {
    try {
      setLoading(true);
      
      console.log("🔍 WorkoutTrackingScreen: loadWorkoutData called");
      
      // Direct AsyncStorage check for debugging
      const asyncStorageWorkout = await AsyncStorage.getItem('current_workout');
      
      if (asyncStorageWorkout) {
        console.log("🔍 WorkoutTrackingScreen: Found existing workout in AsyncStorage");
        
        try {
          // Parse the data before modifying anything
          const existingWorkout = JSON.parse(asyncStorageWorkout);
          
          // Count completed sets BEFORE we do anything
          const completedSets = existingWorkout.exercises.reduce((total, ex) => 
            total + (ex.sets?.filter(s => s.isComplete)?.length || 0), 0);
          
          console.log("🔍 WorkoutTrackingScreen: BEFORE PROCESSING - Workout has", 
            existingWorkout.exercises.length, "exercises and", 
            completedSets, "completed sets");
          
          setWorkout(existingWorkout);
          
          // Update exercise notes for the current exercise
          const exerciseIndex = route.params?.exerciseIndex ?? 0;
          if (exerciseIndex >= 0 && exerciseIndex < existingWorkout.exercises.length) {
            setCurrentExerciseIndex(exerciseIndex);
            setExerciseNotes(existingWorkout.exercises[exerciseIndex].notes || '');
          }
          
          // Check if workout has been started
          const hasStarted = existingWorkout.exercises?.some(exercise => 
            exercise.sets?.some(set => set.isComplete)
          );
          setWorkoutStarted(hasStarted);
          
          console.log("🔍 WorkoutTrackingScreen: Loaded existing workout without modification");
        } catch (parseError) {
          console.error("🔍 WorkoutTrackingScreen: Error parsing workout:", parseError);
          createNewWorkout();
        }
      } else {
        console.log("🔍 WorkoutTrackingScreen: No workout found, creating new");
        createNewWorkout();
      }
    } catch (error) {
      console.error('🔍 WorkoutTrackingScreen: Error loading workout data:', error);
      createNewWorkout();
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to create a new workout
  const createNewWorkout = async () => {
    console.log("🔍 WorkoutTrackingScreen: Creating new workout");
    
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
    
    console.log("🔍 WorkoutTrackingScreen: New workout created with ID:", newWorkout.id);
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
      }
    }
  };

  // Function to toggle set completion
  const toggleSetCompletion = async (setId: string) => {
    if (!workout) return;
    
    try {
      // First, commit any active editing values
      if (editingWeight && editingWeight.setId) {
        await updateSetValue(editingWeight.setId, 'weight', editingWeight.value);
        setEditingWeight(null);
      }
      
      if (editingReps && editingReps.setId) {
        await updateSetValue(editingReps.setId, 'reps', editingReps.value);
        setEditingReps(null);
      }
      
      if (editingRPE && editingRPE.setId) {
        await updateSetValue(editingRPE.setId, 'rpe', editingRPE.value);
        setEditingRPE(null);
      }
      
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
      
      // Update state FIRST
      setWorkout(workoutCopy);
      
      // DIRECT SAVE: Save directly to AsyncStorage first
      const workoutJson = JSON.stringify(workoutCopy);
      await AsyncStorage.setItem('current_workout', JSON.stringify(workoutCopy));
      
      // Then save through service
      await workoutService.saveCurrentWorkout(workoutCopy);
      
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

  // Set up PanResponder for swipe gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        // Only allow panning if not editing text fields
        if (!editingWeight && !editingReps && !editingRPE && !isEditingNotes && !activeSetId) {
          // Move the content horizontally with the finger
          position.setValue(gesture.dx);
        }
      },
      onPanResponderRelease: (event, gesture) => {
        // Only process swipe if not editing
        if (!editingWeight && !editingReps && !editingRPE && !isEditingNotes && !activeSetId) {
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
  
  // Function to update set value
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
  const checkForPersonalRecords = async () => {
    try {
      if (!workout) return;
      
      const currentExercise = workout.exercises[currentExerciseIndex];
      
      // Check for PRs
      const exerciseWithPRs = await workoutService.updatePersonalRecords(currentExercise);
      
      // Check if we have new PRs in the latest completed set
      const newPRs = exerciseWithPRs.sets.filter(set => set.isPR);
      
      if (newPRs.length > 0) {
        // Provide haptic feedback
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
  
  // Handle timer completion
  const handleTimerComplete = () => {
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
  
  // Start or reset the rest timer
  const startRestTimer = (exerciseId: string, setId: string) => {
    // Clear any existing timer
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    
    // Get rest duration from exercise settings or use default
    const exercise = workout?.exercises[currentExerciseIndex];
    const restDuration = exercise?.restBetweenSets || 90;
    
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
      rpe: lastSet?.rpe || null,
      type: lastSet?.type || 'standard'
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
    
    // Reset active set tracking state
    setActiveSetId(null);
    setActiveSetWeight('');
    setActiveSetReps('');
    setActiveSetType('standard');
    
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
    
    // Reset active set tracking state
    setActiveSetId(null);
    
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
  
  // State for handling the active set keyboard workflow
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [activeSetWeight, setActiveSetWeight] = useState('');
  const [activeSetReps, setActiveSetReps] = useState('');
  const [activeSetType, setActiveSetType] = useState('standard');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Listen for keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );
  
    // Cleanup listeners
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Handle selecting a set to edit
  const handleSetSelection = (set: ExerciseSet) => {
    // Don't re-select if already selected or if we're in other editing modes
    if (activeSetId === set.id || editingWeight || editingReps || editingRPE || isEditingNotes) {
      return;
    }
    
    // Initialize the editing state with current values
    setActiveSetId(set.id);
    setActiveSetWeight(set.weight ? set.weight.toString() : '');
    setActiveSetReps(set.reps ? set.reps.toString() : '');
    setActiveSetType(set.type || 'standard');
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Vibration.vibrate(30);
    }
  };
  
  // Save the active set
  const saveActiveSet = async () => {
    if (!workout || !activeSetId) return;
    
    try {
      // Validate inputs
      if (!activeSetWeight || !activeSetReps) {
        Alert.alert('Missing Information', 'Please enter both weight and reps before saving the set.');
        return;
      }
      
      // Create a deep copy of the current workout
      const workoutCopy = JSON.parse(JSON.stringify(workout));
      
      // Find and update the set
      let updatedSet = false;
      
      for (const exercise of workoutCopy.exercises) {
        for (let i = 0; i < exercise.sets.length; i++) {
          if (exercise.sets[i].id === activeSetId) {
            // Update the set
            exercise.sets[i] = {
              ...exercise.sets[i],
              weight: parseFloat(activeSetWeight),
              reps: parseInt(activeSetReps),
              type: activeSetType,
              isComplete: true,
              completedAt: new Date().toISOString()
            };
            updatedSet = true;
            break;
          }
        }
        if (updatedSet) break;
      }
      
      if (!updatedSet) {
        console.error(`Set with ID ${activeSetId} not found`);
        return;
      }
      
      // Update state
      setWorkout(workoutCopy);
      
      // Save to storage
      await AsyncStorage.setItem('current_workout', JSON.stringify(workoutCopy));
      await workoutService.saveCurrentWorkout(workoutCopy);
      
      // Set as last completed for animation
      setLastCompletedSetId(activeSetId);
      
      // Provide feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Vibration.vibrate(100);
      }
      
      // Start rest timer
      const currentExercise = workout.exercises[currentExerciseIndex];
      startRestTimer(currentExercise.id, activeSetId);
      
      // Check for PRs
      checkForPersonalRecords();
      
      // Reset active set state
      setActiveSetId(null);
      setActiveSetWeight('');
      setActiveSetReps('');
      setActiveSetType('standard');
      
      // Dismiss keyboard
      Keyboard.dismiss();
      
    } catch (error) {
      console.error('Error saving active set:', error);
      Alert.alert('Error', 'Failed to save the set');
    }
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
        keyboardShouldPersistTaps="handled"
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
              const isSelected = set.id === activeSetId;
              
              // Animation for the last completed set
              const isLastCompleted = set.id === lastCompletedSetId;
              
              return (
                <TouchableOpacity
                  key={set.id}
                  style={[
                    styles.setRow,
                    isActive && styles.activeSetRow,
                    isInactive && styles.inactiveSetRow,
                    isSelected && styles.selectedSetRow,
                    isLastCompleted && {
                      backgroundColor: setCompleteAnimation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: ['#FCFDFD', '#E0F2FE', '#FCFDFD']
                      })
                    }
                  ]}
                  onPress={() => handleSetSelection(set)}
                  activeOpacity={0.7}
                  disabled={set.isComplete || isInactive || editingWeight || editingReps || editingRPE || isEditingNotes}
                >
                  <View style={styles.setRowContent}>
                    {/* Set number */}
                    <View style={styles.setNumberContainer}>
                      <Text style={[
                        styles.setNumber, 
                        isInactive && styles.inactiveText,
                        isSelected && styles.selectedText
                      ]}>
                        {String(set.setNumber).padStart(2, '0')}
                      </Text>
                    </View>
                    
                    {/* Previous performance */}
                    <View style={styles.previousContainer}>
                      {set.previousWeight && set.previousReps ? (
                        <Text style={[
                          styles.previousText, 
                          isInactive && styles.inactiveText,
                          isSelected && styles.selectedText
                        ]}>
                          {set.previousWeight}kg × {set.previousReps}
                        </Text>
                      ) : (
                        <Text style={[
                          styles.previousText, 
                          styles.emptyValue, 
                          isInactive && styles.inactiveText,
                          isSelected && styles.selectedText
                        ]}>
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
                        <Text style={[
                          styles.weightValue, 
                          !set.weight && styles.emptyValue,
                          isInactive && styles.inactiveText,
                          isSelected && styles.selectedText,
                          // Add a visual indicator if value is saved but set not completed
                          (set.weight && !set.isComplete) && styles.savedButNotCompletedText
                        ]}>
                          {set.weight?.toString() || '-'}
                        </Text>
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
                        <Text style={[
                          styles.repsValue, 
                          !set.reps && styles.emptyValue,
                          isInactive && styles.inactiveText,
                          isSelected && styles.selectedText
                        ]}>
                          {set.reps?.toString() || '-'}
                        </Text>
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
                        <Text style={[
                          styles.rpeValue, 
                          !set.rpe && styles.emptyValue,
                          isInactive && styles.inactiveText,
                          !set.isComplete && styles.disabledText,
                          isSelected && styles.selectedText
                        ]}>
                          {set.rpe?.toString() || '-'}
                        </Text>
                      )}
                    </View>
                    
                    {/* Completion checkbox / PR indicator */}
                    <View style={styles.completionContainer}>
                      {set.isPR ? (
                        <View style={styles.prContainer}>
                          <Award size={20} color="#F59E0B" />
                        </View>
                      ) : (
                        set.isComplete ? (
                          <View style={styles.completedIndicator}>
                            <Check size={16} color="#FFFFFF" />
                          </View>
                        ) : (
                          <View style={[
                            styles.incompleteIndicator,
                            isSelected && styles.selectedIncompleteIndicator
                          ]} />
                        )
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
                </TouchableOpacity>
              );
            })}
          </View>
  
          {/* Add Set Button - Only show if no active set */}
          {!activeSetId && (
  <View style={styles.saveSetContainer}>
    <TouchableOpacity 
      style={styles.saveSetButton} 
      onPress={() => saveCurrentSet()}
      disabled={findNextIncompleteSetIndex() < 0}
    >
      <Text style={styles.saveSetText}>Save Set</Text>
      <Check size={20} color="#FFFFFF" />
    </TouchableOpacity>
  </View>
)}
          
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
      
      {/* Set Keyboard Wrapper */}
      {keyboardVisible && activeSetId && (
  <SetKeyboardWrapper
    activeSet={currentExercise.sets.find(set => set.id === activeSetId)}
    weight={activeSetWeight}
    reps={activeSetReps}
    setType={activeSetType}
    onWeightChange={setActiveSetWeight}
    onRepsChange={setActiveSetReps}
    onSetTypeChange={setActiveSetType}
    onSave={saveActiveSet}
  />
)}
</SafeAreaView>
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
        saveSetContainer: {
          paddingHorizontal: 16,
          marginBottom: 16,
        },
        saveSetButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.indigo[600],
          borderRadius: 8,
          paddingVertical: 14,
          paddingHorizontal: 24,
          gap: 8,
        },
        saveSetText: {
          fontFamily: fonts.medium,
          fontSize: 16,
          color: '#FFFFFF',
        },
        completedIndicator: {
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: colors.indigo[600],
          justifyContent: 'center',
          alignItems: 'center',
        },
        incompleteIndicator: {
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: '#E5E7EB',
        },
        selectedSetRow: {
            backgroundColor: '#EEF2FF', // Light indigo background for selected set
            borderLeftWidth: 3,
            borderLeftColor: colors.indigo[600],
          },
          selectedText: {
            color: colors.indigo[600],
            fontWeight: '500',
          },
          selectedIncompleteIndicator: {
            borderColor: colors.indigo[600],
            borderWidth: 2,
          },
          completedIndicator: {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.indigo[600],
            justifyContent: 'center',
            alignItems: 'center',
          },
          incompleteIndicator: {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: '#E5E7EB',
          },
          savedButNotCompletedText: {
            color: '#4F46E5',
            fontStyle: 'normal',
          },
        
          // Styles for the bottom keyboard UI
          keyboardAccessoryContainer: {
            backgroundColor: colors.gray[50],
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            paddingHorizontal: 16,
            paddingVertical: 12,
          },
          keyboardAccessoryHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          },
          keyboardAccessoryTitle: {
            fontFamily: fonts.semiBold,
            fontSize: 16,
            color: colors.gray[900],
          },
          keyboardAccessoryCloseButton: {
            padding: 4,
          },
          setTypeSelector: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.common.white,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginBottom: 16,
          },
          setTypeSelectorText: {
            fontFamily: fonts.medium,
            fontSize: 16,
            color: colors.gray[900],
          },
          inputRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 16,
            gap: 12,
      });