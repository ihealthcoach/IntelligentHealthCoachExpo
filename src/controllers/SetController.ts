import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout, WorkoutExercise, ExerciseSet } from '../types/workout';
import { workoutService } from '../services/workoutService';

/**
 * Controller class for set-related operations
 */
export class SetController {
  /**
   * Update a specific value (weight, reps, RPE) for a set
   */
  static async updateSetValue(
    workout: Workout,
    setId: string,
    field: 'weight' | 'reps' | 'rpe',
    value: string | number
  ): Promise<Workout> {
    if (!workout) throw new Error('No workout provided');
    
    // Convert value to number or null
    const numValue = value === '' 
      ? null 
      : typeof value === 'number' 
        ? value 
        : parseFloat(value as string);
    
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
      throw new Error(`Set with ID ${setId} not found`);
    }
    
    // DIRECT SAVE: Save directly to AsyncStorage for maximum reliability
    const workoutJson = JSON.stringify(workoutCopy);
    await AsyncStorage.setItem('current_workout', workoutJson);
    
    // Then also save through service
    await workoutService.saveCurrentWorkout(workoutCopy);
    
    console.log(`Successfully updated ${field} to ${numValue} for set ${setId}`);
    
    return workoutCopy;
  }

  /**
   * Toggle a set's completion status
   */
  static async toggleSetCompletion(
    workout: Workout,
    setId: string
  ): Promise<{
    workout: Workout;
    isComplete: boolean;
  }> {
    if (!workout) throw new Error('No workout provided');
    
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
      throw new Error(`Set ${setId} not found`);
    }
    
    // DIRECT SAVE: Save directly to AsyncStorage first
    const workoutJson = JSON.stringify(workoutCopy);
    await AsyncStorage.setItem('current_workout', workoutJson);
    
    // Then save through service
    await workoutService.saveCurrentWorkout(workoutCopy);
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    return {
      workout: workoutCopy,
      isComplete: newCompletionState
    };
  }

  /**
   * Add a new set to an exercise
   */
  static async addSet(
    workout: Workout,
    exerciseIndex: number
  ): Promise<Workout> {
    if (!workout) throw new Error('No workout provided');
    
    const currentExercise = workout.exercises[exerciseIndex];
    if (!currentExercise) throw new Error('Exercise not found');
    
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
      if (index === exerciseIndex) {
        return {
          ...exercise,
          sets: [...exercise.sets, newSet]
        };
      }
      return exercise;
    });
    
    // DIRECT SAVE: Save directly to AsyncStorage first
    const workoutJson = JSON.stringify(workoutCopy);
    await AsyncStorage.setItem('current_workout', workoutJson);
    
    // Then save through service
    await workoutService.saveCurrentWorkout(workoutCopy);
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    return workoutCopy;
  }

  /**
   * Remove a set from an exercise
   */
  static async removeSet(
    workout: Workout,
    exerciseIndex: number,
    setId: string
  ): Promise<Workout> {
    if (!workout) throw new Error('No workout provided');
    
    const currentExercise = workout.exercises[exerciseIndex];
    if (!currentExercise) throw new Error('Exercise not found');
    
    // Don't allow removing if there's only one set
    if (currentExercise.sets.length <= 1) {
      throw new Error('Cannot remove - must have at least one set');
    }
    
    // Create a deep copy
    const workoutCopy = JSON.parse(JSON.stringify(workout));
    
    // Update the exercise by filtering out the set and renumbering
    workoutCopy.exercises = workoutCopy.exercises.map((exercise, index) => {
      if (index === exerciseIndex) {
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
    
    // Save to AsyncStorage
    await AsyncStorage.setItem('current_workout', JSON.stringify(workoutCopy));
    
    // Save through service
    await workoutService.saveCurrentWorkout(workoutCopy);
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    return workoutCopy;
  }

  /**
   * Save a complete set with all values
   */
  static async saveSet(
    workout: Workout,
    exerciseIndex: number,
    setIndex: number,
    weight: number | null,
    reps: number | null,
    rpe: number | null
  ): Promise<{
    workout: Workout;
    updatedSet: ExerciseSet;
  }> {
    if (!workout) throw new Error('No workout provided');
    
    // Validate input - we need at least weight and reps
    if (weight === null || reps === null) {
      throw new Error('Weight and reps are required');
    }
    
    // Create deep copy of workout
    const workoutCopy = JSON.parse(JSON.stringify(workout));
    
    // Get the exercise and set
    const exercise = workoutCopy.exercises[exerciseIndex];
    if (!exercise) throw new Error('Exercise not found');
    
    const set = exercise.sets[setIndex];
    if (!set) throw new Error('Set not found');
    
    // Update the set with new values
    set.weight = weight;
    set.reps = reps;
    set.rpe = rpe;
    set.isComplete = true;
    set.completedAt = new Date().toISOString();
    
    // Save the workout
    await AsyncStorage.setItem('current_workout', JSON.stringify(workoutCopy));
    await workoutService.saveCurrentWorkout(workoutCopy);
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    return {
      workout: workoutCopy,
      updatedSet: set
    };
  }

  /**
   * Find the index of the next incomplete set
   */
  static findNextIncompleteSetIndex(exercise: WorkoutExercise): number {
    if (!exercise || !exercise.sets) return -1;
    return exercise.sets.findIndex(set => !set.isComplete);
  }

  /**
   * Create initial set for a new exercise
   */
  static createInitialSet(exerciseId: string): ExerciseSet {
    return {
      id: `${exerciseId}-set-${Date.now()}`,
      setNumber: 1,
      weight: null,
      reps: null,
      isComplete: false
    };
  }
}