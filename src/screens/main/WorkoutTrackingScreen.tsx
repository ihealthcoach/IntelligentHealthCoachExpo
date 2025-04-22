import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text,
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
  Platform
} from 'react-native';
import { Portal, Modal } from 'react-native-paper';
import { MainStackScreenProps } from '../../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { workoutService } from '../../services/workoutService';
import { useFocusEffect } from '@react-navigation/native';
import { Workout, ExerciseSet, WorkoutStatus } from '../../types/workout';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';

// Controllers
import { SetController } from '../../controllers/SetController';
import { useRestTimer } from '../../controllers/RestTimerController';

// Components
import WorkoutHeader from '../../components/workout/WorkoutHeader';
import RestTimer from '../../components/workout/RestTimer';
import ExerciseHeader from '../../components/workout/ExerciseHeader';
import SetsTableHeader from '../../components/workout/SetsTableHeader';
import SetRow from '../../components/workout/SetRow';
import SetActionButtons from '../../components/workout/SetActionButtons';
import ExerciseHistorySection from '../../components/workout/ExerciseHistorySection';
import ExerciseInfoSection from '../../components/workout/ExerciseInfoSection';
import OneRepMaxCard from '../../components/workout/OneRepMaxCard';
import BottomNavigation from '../../components/workout/BottomNavigation';
import CompletionModal from '../../components/workout/CompletionModal';
import CompletionSheet from '../../components/workout/CompletionSheet';
import SetKeyboardWrapper from '../../components/workout/SetKeyboardWrapper';

// Styles
import { colors } from '../../styles/colors';

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
  const [showSetSheet, setShowSetSheet] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Set editing state
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [activeSetWeight, setActiveSetWeight] = useState('');
  const [activeSetReps, setActiveSetReps] = useState('');
  const [activeSetType, setActiveSetType] = useState('standard');
  
  // Visual feedback states
  const [lastCompletedSetId, setLastCompletedSetId] = useState<string | null>(null);
  const [showPrConfetti, setShowPrConfetti] = useState(false);
  
  // Note editing
  const [exerciseNotes, setExerciseNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  
  // Expanded sections
  const [showExerciseHistory, setShowExerciseHistory] = useState(false);
  
  // Animation values for swipe
  const position = useRef(new Animated.Value(0)).current;
  const setCompleteAnimation = useRef(new Animated.Value(0)).current;
  
  // Use the rest timer controller hook
  const { 
    restTimer, 
    startRestTimer, 
    pauseRestTimer, 
    resumeRestTimer, 
    skipRestTimer, 
    formatTime 
  } = useRestTimer(
    // Timer complete callback
    () => Alert.alert('Rest Complete', 'Ready for your next set!'), 
    // Default rest time (90 seconds)
    90
  );

  // Initial data loading and timer cleanup
  useEffect(() => {
    loadWorkoutData();
    
    return () => {
      saveWorkoutData();
    };
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadWorkoutData();
      return () => {};
    }, [])
  );

  // Check for completed sets
  useEffect(() => {
    if (!workout) return;
    
    const currentExercise = workout.exercises[currentExerciseIndex];
    const allSetsCompletedInCurrentExercise = currentExercise.sets.length > 0 && 
      currentExercise.sets.every(set => set.isComplete);
    
    const isLastExercise = currentExerciseIndex === workout.exercises.length - 1;
    
    if (allSetsCompletedInCurrentExercise) {
      if (isLastExercise) {
        // If this is the last exercise and all sets completed, show completion modal
        setCompletionModalVisible(true);
      } else {
        // Otherwise just show the sheet for the current exercise
        setAllSetsCompleted(true);
        setCompletionSheetVisible(true);
      }
    } else if (!allSetsCompletedInCurrentExercise && allSetsCompleted) {
      setAllSetsCompleted(false);
      setCompletionSheetVisible(false);
    }
  }, [workout, currentExerciseIndex]);

  // Set up PanResponder for swipe gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        // Only allow panning if not editing text fields
        if (!isEditingNotes && !activeSetId) {
          // Move the content horizontally with the finger
          position.setValue(gesture.dx);
        }
      },
      onPanResponderRelease: (event, gesture) => {
        // Only process swipe if not editing
        if (!isEditingNotes && !activeSetId) {
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

  // Load workout data from AsyncStorage
  const loadWorkoutData = async () => {
    try {
      setLoading(true);
      
      // Get exercise index from navigation params
      const exerciseIndex = route.params?.exerciseIndex ?? 0;
      
      // Load workout data from workoutService
      const currentWorkout = await workoutService.getCurrentWorkout();
      
      if (currentWorkout) {
        setWorkout(currentWorkout);
        
        // Set exercise index from params
        if (exerciseIndex >= 0 && exerciseIndex < currentWorkout.exercises.length) {
          setCurrentExerciseIndex(exerciseIndex);
          
          // Set initial notes for the selected exercise
          setExerciseNotes(currentWorkout.exercises[exerciseIndex].notes || '');
        }
        
        // Check if workout has been started
        const hasStarted = currentWorkout.exercises?.some(exercise => 
          exercise.sets?.some(set => set.isComplete)
        );
        setWorkoutStarted(hasStarted);
      } else {
        // Create a new workout if none exists
        const newWorkout: Workout = {
          id: Date.now().toString(),
          name: 'New Workout',
          exercises: [],
          status: 'not_started',
          startedAt: new Date().toISOString()
        };
        
        setWorkout(newWorkout);
        await workoutService.saveCurrentWorkout(newWorkout);
      }
    } catch (error) {
      console.error('Error loading workout data:', error);
      Alert.alert('Error', 'Failed to load workout data');
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentSet = async () => {
    if (!workout) return;
    
    // Find the next incomplete set
    const activeSetIndex = findNextIncompleteSetIndex();
    if (activeSetIndex < 0) return; // No incomplete sets
    
    const currentExercise = workout.exercises[currentExerciseIndex];
    const activeSet = currentExercise.sets[activeSetIndex];
    
    // Check if set has necessary values
    if (!activeSet.weight || !activeSet.reps) {
      Alert.alert('Missing Information', 'Please enter both weight and reps before saving the set.');
      return;
    }
    
    try {
      // Mark set as complete
      const updatedWorkout = JSON.parse(JSON.stringify(workout));
      updatedWorkout.exercises[currentExerciseIndex].sets[activeSetIndex].isComplete = true;
      updatedWorkout.exercises[currentExerciseIndex].sets[activeSetIndex].completedAt = new Date().toISOString();
      
      // Update state
      setWorkout(updatedWorkout);
      
      // Save to storage
      await workoutService.saveCurrentWorkout(updatedWorkout);
      
      // Provide feedback
      setLastCompletedSetId(activeSet.id);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Start rest timer
      startRestTimer(currentExercise.id, activeSet.id);
      
      // Check for PRs
      checkForPersonalRecords();
      
    } catch (error) {
      console.error('Error saving set:', error);
      Alert.alert('Error', 'Failed to save the set');
    }
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
      } catch (error) {
        console.error('Error saving workout data:', error);
      }
    }
  };
  
  // Handle set selection for editing
  const handleSetPress = (set: ExerciseSet) => {
    // Only allow selecting incomplete sets
    if (set.isComplete) return;
    
    // Set the active set ID
    setActiveSetId(set.id);
    
    // Set initial values
    setActiveSetWeight(set.weight ? set.weight.toString() : '');
    setActiveSetReps(set.reps ? set.reps.toString() : '');
    setActiveSetType('standard'); // Default type
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Save active set
  const saveActiveSet = async () => {
    if (!workout || !activeSetId) return;
    
    try {
      // Parse values
      const weight = activeSetWeight ? parseFloat(activeSetWeight) : null;
      const reps = activeSetReps ? parseInt(activeSetReps, 10) : null;
      
      if (!weight || !reps) {
        Alert.alert('Missing Information', 'Please enter both weight and reps.');
        return;
      }
      
      // Find the exercise and set indices
      let exerciseIndex = -1;
      let setIndex = -1;
      
      workout.exercises.forEach((ex, exIdx) => {
        ex.sets.forEach((s, sIdx) => {
          if (s.id === activeSetId) {
            exerciseIndex = exIdx;
            setIndex = sIdx;
          }
        });
      });
      
      if (exerciseIndex === -1 || setIndex === -1) {
        console.error('Set not found:', activeSetId);
        return;
      }
      
      // Use SetController to save set
      const { workout: updatedWorkout, updatedSet } = await SetController.saveSet(
        workout,
        exerciseIndex,
        setIndex,
        weight,
        reps,
        null // RPE could be added later
      );
      
      // Update state
      setWorkout(updatedWorkout);
      
      // Reset active set
      setActiveSetId(null);
      setActiveSetWeight('');
      setActiveSetReps('');
      
      // Set last completed set for animation
      setLastCompletedSetId(updatedSet.id);
      
      // Start rest timer
      startRestTimer(
        workout.exercises[exerciseIndex].id, 
        updatedSet.id
      );
      
      // Check for PRs
      checkForPersonalRecords();
    } catch (error) {
      console.error('Error saving set:', error);
      Alert.alert('Error', 'Failed to save the set');
    }
  };
  
  // Toggle set completion status
  const toggleSetCompletion = async (setId: string) => {
    if (!workout) return;
    
    try {
      // Use SetController to toggle completion
      const { workout: updatedWorkout, isComplete } = await SetController.toggleSetCompletion(
        workout,
        setId
      );
      
      // Update state
      setWorkout(updatedWorkout);
      
      // Only start rest timer if set was completed
      if (isComplete) {
        setLastCompletedSetId(setId);
        
        // Find the exercise ID for the set
        let exerciseId = '';
        updatedWorkout.exercises.forEach(ex => {
          ex.sets.forEach(s => {
            if (s.id === setId) exerciseId = ex.id;
          });
        });
        
        if (exerciseId) {
          startRestTimer(exerciseId, setId);
        }
      }
    } catch (error) {
      console.error('Error toggling set completion:', error);
      Alert.alert('Error', 'Failed to update set');
    }
  };
  
  // Add a new set
  const addSet = async () => {
    if (!workout) return;
    
    try {
      // Use SetController to add a set
      const updatedWorkout = await SetController.addSet(
        workout,
        currentExerciseIndex
      );
      
      // Update state
      setWorkout(updatedWorkout);
      
      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Error adding set:', error);
      Alert.alert('Error', 'Failed to add set');
    }
  };
  
  // Remove a set
  const removeSet = async (setId: string) => {
    if (!workout) return;
    
    Alert.alert(
      'Remove Set',
      'Are you sure you want to remove this set?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Use SetController to remove the set
              const updatedWorkout = await SetController.removeSet(
                workout,
                currentExerciseIndex,
                setId
              );
              
              // Update state
              setWorkout(updatedWorkout);
              
            } catch (error) {
              if (error.message?.includes('must have at least one set')) {
                Alert.alert('Cannot Remove', 'You must have at least one set');
              } else {
                console.error('Error removing set:', error);
                Alert.alert('Error', 'Failed to remove set');
              }
            }
          }
        }
      ]
    );
  };
  
  // Check for personal records
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
        }
        
        // Update the workout with PR flags
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

  const handleSetSelection = (set: ExerciseSet) => {
    // Only allow selecting incomplete sets
    if (set.isComplete) return;
    
    // Set the active set ID
    setActiveSetId(set.id);
    
    // Set initial values
    setActiveSetWeight(set.weight ? set.weight.toString() : '');
    setActiveSetReps(set.reps ? set.reps.toString() : '');
    setActiveSetType('standard'); // Default type
    
    // Force keyboard visibility
    setKeyboardVisible(true);
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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
    
    // Save current exercise notes
    await updateExerciseNotes();
    
    // Force save current workout data
    await saveWorkoutData();
    
    // Skip any active timer
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
        
        // Reset completion states when moving to new exercise
        setAllSetsCompleted(false);
        setCompletionSheetVisible(false);
      } else {
        // Only show completion modal if we're at the last exercise
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
      // Save everything before navigating away
      await updateExerciseNotes();
      await saveWorkoutData();
    }
    
    // Wait a moment to ensure saves complete before navigation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Navigate back
    navigation.goBack();
  };
  
  // Handle completing the workout
  const completeWorkout = async () => {
    try {
      if (!workout) return;
      
      // Save any unsaved notes
      await updateExerciseNotes();
      
      // Add completion timestamp and update status
      const completedWorkout = {
        ...workout,
        completedAt: new Date().toISOString(),
        status: 'completed' as WorkoutStatus
      };
      
      // Complete the workout using the service
      await workoutService.completeWorkout(completedWorkout);
      
      // Navigate to main tabs
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      console.error('Error completing workout:', error);
      Alert.alert('Error', 'Failed to save workout data');
    }
  };
  
  // Handle continuing the workout without completing
  const continueWorkout = () => {
    setCompletionModalVisible(false);
  };
  
  // Calculate sets completed for current exercise
  const getCompletedSetsText = () => {
    if (!workout) return "";
    
    const currentExercise = workout.exercises[currentExerciseIndex];
    const completedSets = currentExercise.sets.filter(set => set.isComplete).length;
    const totalSets = currentExercise.sets.length;
    
    return `${completedSets} of ${totalSets} sets completed`;
  };
  
  // Functions for completion sheet
  const handleAddMoreSets = () => {
    setCompletionSheetVisible(false);
    addSet();
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
    return SetController.findNextIncompleteSetIndex(workout.exercises[currentExerciseIndex]);
  };
  
  // Current exercise data
  const currentExercise = workout?.exercises[currentExerciseIndex];
  
  // Loading state
  if (!workout || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }
  
  // Get active set index
  const activeSetIndex = findNextIncompleteSetIndex();
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <WorkoutHeader
        currentExerciseIndex={currentExerciseIndex}
        totalExercises={workout.exercises.length}
        onBackPress={handleBackToOverview}
      />
      
      {/* Rest Timer */}
      {restTimer.isActive && (
        <RestTimer
          isActive={restTimer.isActive}
          timeRemaining={restTimer.timeRemaining}
          defaultDuration={restTimer.defaultDuration}
          formattedTime={formatTime(restTimer.timeRemaining)}
          onSkip={skipRestTimer}
          onPause={pauseRestTimer}
          onResume={resumeRestTimer}
          onRestart={() => startRestTimer(restTimer.exerciseId!, restTimer.setId!)}
        />
      )}
      
      <Animated.ScrollView 
        style={[
          styles.scrollView,
          { transform: [{ translateX: position }] }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.content}>
          {/* Exercise Header */}
          <ExerciseHeader
            exercise={currentExercise}
            getCompletedSetsText={getCompletedSetsText}
            isEditingNotes={isEditingNotes}
            exerciseNotes={exerciseNotes}
            setExerciseNotes={setExerciseNotes}
            setIsEditingNotes={setIsEditingNotes}
            updateExerciseNotes={updateExerciseNotes}
          />
          
          {/* Sets Section */}
          <View style={styles.setsSection}>
            {/* Sets table header */}
            <SetsTableHeader />
            
            {/* Set rows */}
            {currentExercise.sets.map((set, index) => {
              // Determine if set should be active or inactive
              const isActive = index === activeSetIndex;
              const isInactive = index > activeSetIndex && activeSetIndex !== -1;
              const isSelected = set.id === activeSetId;
              
              // Animation for the last completed set
              const isLastCompleted = set.id === lastCompletedSetId;
              
              return (
<SetRow
  key={set.id}
  set={set}
  index={index}
  isActive={isActive}
  isInactive={isInactive}
  isLastCompleted={isLastCompleted}
  isSelected={activeSetId === set.id}
  completeAnimation={setCompleteAnimation}
  onSetPress={handleSetSelection}  // Pass your handler here
  onToggleCompletion={toggleSetCompletion}
  onRemove={removeSet}
/>
              );
            })}
          </View>
          
          {/* Set Action Buttons */}
          <SetActionButtons
            onSaveSet={saveCurrentSet}
            onAddSet={addSet}
            hasIncompleteSets={activeSetIndex !== -1}
          />
          
          {/* Exercise History Section */}
          <ExerciseHistorySection
            history={currentExercise.exerciseHistory}
            isExpanded={showExerciseHistory}
            onToggleExpand={() => setShowExerciseHistory(!showExerciseHistory)}
          />
          
          {/* Exercise Information */}
          <ExerciseInfoSection
            primaryMuscles={currentExercise.primaryMuscles}
            equipment={currentExercise.equipment}
            targetMuscleGroups={currentExercise.targetMuscleGroups}
          />
          
          {/* One Rep Max Card */}
          <OneRepMaxCard
            estimatedOneRepMax={currentExercise.estimatedOneRepMax}
          />
          
          {/* Bottom padding for floating button */}
          <View style={styles.bottomPadding} />
        </View>
      </Animated.ScrollView>
      
      {/* Bottom Navigation */}
      <BottomNavigation
        onNotesPress={() => setIsEditingNotes(true)}
      />
      
      {/* Workout Completion Modal */}
      <CompletionModal
        visible={completionModalVisible}
        onDismiss={() => setCompletionModalVisible(false)}
        onCompleteWorkout={completeWorkout}
        onContinueWorkout={continueWorkout}
      />
      
      {/* Completion Sheet */}
      <CompletionSheet
        visible={completionSheetVisible}
        onDismiss={() => setCompletionSheetVisible(false)}
        onAddMoreSets={handleAddMoreSets}
        onGoToNextExercise={handleNextExercise}
        onContinueEditing={handleContinueEditing}
        onAddExercise={handleAddExercise}
      />
      
      {/* Set Keyboard Input */}
      {activeSetId && (
        <SetKeyboardWrapper
          activeSet={workout.exercises[currentExerciseIndex].sets.find(s => s.id === activeSetId)}
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
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#4B5563',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 0,
    paddingBottom: 120,
  },
  setsSection: {
    marginBottom: 16,
  },
  bottomPadding: {
    height: 100,
  },
});