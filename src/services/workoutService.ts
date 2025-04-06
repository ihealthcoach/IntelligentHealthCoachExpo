import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';
import { 
  Workout, 
  WorkoutExercise, 
  ExerciseSet, 
  WorkoutTemplate
} from '../types/workout';

// Keys for AsyncStorage
const KEYS = {
  CURRENT_WORKOUT: 'current_workout',
  PENDING_SYNCS: 'pending_workout_syncs',
  WORKOUT_TEMPLATES: 'workout_templates',
  WORKOUT_HISTORY: 'workout_history'
};

/**
 * Service to handle all workout-related data operations
 */
class WorkoutService {
  /**
   * Loads the current workout from AsyncStorage
   */
  async getCurrentWorkout(): Promise<Workout | null> {
    try {
      const workoutJson = await AsyncStorage.getItem(KEYS.CURRENT_WORKOUT);
      if (!workoutJson) return null;
      return JSON.parse(workoutJson);
    } catch (error) {
      console.error('Error loading current workout:', error);
      return null;
    }
  }

  /**
   * Saves the current workout to AsyncStorage
   */
  async saveCurrentWorkout(workout: Workout): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.CURRENT_WORKOUT, JSON.stringify(workout));
    } catch (error) {
      console.error('Error saving current workout:', error);
      throw error;
    }
  }

  /**
   * Clears the current workout from AsyncStorage
   */
  async clearCurrentWorkout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.CURRENT_WORKOUT);
    } catch (error) {
      console.error('Error clearing current workout:', error);
      throw error;
    }
  }

  /**
   * Completes a workout - saves to history and syncs to Supabase if online
   */
  async completeWorkout(workout: Workout): Promise<void> {
    try {
      // Add completion timestamp
      const completedWorkout = {
        ...workout,
        completedAt: new Date().toISOString(),
        status: 'completed'
      };

      // Try to sync with Supabase first
      const isConnected = await this.checkConnectivity();
      
      if (isConnected) {
        // If online, try to sync immediately
        await this.syncWorkoutToSupabase(completedWorkout);
      } else {
        // If offline, add to pending syncs
        await this.addToPendingSyncs(completedWorkout);
      }

      // Add to local workout history regardless of sync status
      await this.addToWorkoutHistory(completedWorkout);
      
      // Clear the current workout
      await this.clearCurrentWorkout();
    } catch (error) {
      console.error('Error completing workout:', error);
      throw error;
    }
  }

  /**
   * Check device connectivity
   */
  private async checkConnectivity(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true;
  }

  /**
   * Add a workout to the pending syncs queue
   */
  private async addToPendingSyncs(workout: Workout): Promise<void> {
    try {
      // Get existing pending syncs
      const pendingSyncsJson = await AsyncStorage.getItem(KEYS.PENDING_SYNCS);
      const pendingSyncs = pendingSyncsJson ? JSON.parse(pendingSyncsJson) : [];
      
      // Add this workout to pending syncs
      pendingSyncs.push(workout);
      
      // Save updated pending syncs
      await AsyncStorage.setItem(KEYS.PENDING_SYNCS, JSON.stringify(pendingSyncs));
    } catch (error) {
      console.error('Error adding to pending syncs:', error);
      throw error;
    }
  }

  /**
   * Add a workout to local history
   */
  private async addToWorkoutHistory(workout: Workout): Promise<void> {
    try {
      // Get existing workout history
      const historyJson = await AsyncStorage.getItem(KEYS.WORKOUT_HISTORY);
      const history = historyJson ? JSON.parse(historyJson) : [];
      
      // Add this workout to history
      history.unshift(workout); // Add to the beginning of the array
      
      // Save updated history
      await AsyncStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Error adding to workout history:', error);
      throw error;
    }
  }

  /**
   * Sync a workout to Supabase
   */
  private async syncWorkoutToSupabase(workout: Workout): Promise<void> {
    try {
      // First insert the workout record
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          id: workout.id || uuidv4(),
          user_id: workout.userId,
          name: workout.name,
          date: workout.completedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          notes: workout.notes,
          duration: workout.duration,
          completed: true
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Then insert each exercise
      for (const exercise of workout.exercises) {
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('workout_exercise_details')
          .insert({
            workout_id: workoutData.id,
            exercise_id: exercise.exerciseId,
            order: workout.exercises.indexOf(exercise) + 1,
            notes: exercise.notes
          })
          .select()
          .single();

        if (exerciseError) throw exerciseError;

        // Then insert each set
        for (const set of exercise.sets) {
          const { error: setError } = await supabase
            .from('workout_sets')
            .insert({
              workout_exercise_id: exerciseData.id,
              set_number: set.setNumber,
              reps: set.reps,
              weight: set.weight,
              duration: null, // Add if implemented
              distance: null, // Add if implemented
              notes: null // Add if needed
            });

          if (setError) throw setError;
        }
      }
    } catch (error) {
      console.error('Error syncing workout to Supabase:', error);
      throw error;
    }
  }

  /**
   * Try to sync any pending workouts in the background
   */
  async syncPendingWorkouts(): Promise<void> {
    try {
      const isConnected = await this.checkConnectivity();
      if (!isConnected) return; // Skip if offline

      // Get pending syncs
      const pendingSyncsJson = await AsyncStorage.getItem(KEYS.PENDING_SYNCS);
      if (!pendingSyncsJson) return; // No pending syncs
      
      const pendingSyncs = JSON.parse(pendingSyncsJson);
      if (pendingSyncs.length === 0) return; // Empty array

      // Track successful syncs
      const successfulSyncs = [];

      // Try to sync each pending workout
      for (const workout of pendingSyncs) {
        try {
          await this.syncWorkoutToSupabase(workout);
          successfulSyncs.push(workout.id);
        } catch (error) {
          console.error(`Error syncing workout ${workout.id}:`, error);
          // Continue with next workout
        }
      }

      // Remove successfully synced workouts from pending
      if (successfulSyncs.length > 0) {
        const remainingPendingSyncs = pendingSyncs.filter(
          workout => !successfulSyncs.includes(workout.id)
        );
        await AsyncStorage.setItem(KEYS.PENDING_SYNCS, JSON.stringify(remainingPendingSyncs));
      }
    } catch (error) {
      console.error('Error syncing pending workouts:', error);
      // Don't throw - this runs in background
    }
  }

  /**
   * Get workout history
   */
  async getWorkoutHistory(): Promise<Workout[]> {
    try {
      // Try to get from AsyncStorage first
      const historyJson = await AsyncStorage.getItem(KEYS.WORKOUT_HISTORY);
      let history = historyJson ? JSON.parse(historyJson) : [];

      // If online, try to sync with Supabase to get latest
      const isConnected = await this.checkConnectivity();
      if (isConnected) {
        try {
          const { data, error } = await supabase
            .from('workouts')
            .select(`
              id, name, date, notes, duration, completed,
              workout_exercise_details (
                id, exercise_id, order, notes,
                workout_sets (
                  id, set_number, reps, weight, duration, distance, notes
                )
              )
            `)
            .eq('completed', true)
            .order('date', { ascending: false });

          if (!error && data) {
            // Map Supabase data to our workout type
            const supabaseWorkouts: Workout[] = data.map(item => {
              return {
                id: item.id,
                name: item.name,
                completedAt: item.date,
                notes: item.notes,
                duration: item.duration,
                status: 'completed',
                exercises: item.workout_exercise_details.map(detail => {
                  return {
                    id: detail.id,
                    exerciseId: detail.exercise_id,
                    name: 'Loading...', // We would need to get exercise details in a separate query
                    notes: detail.notes,
                    sets: detail.workout_sets.map(set => {
                      return {
                        id: set.id,
                        setNumber: set.set_number,
                        weight: set.weight,
                        reps: set.reps,
                        isComplete: true
                      };
                    }),
                    isExpanded: false
                  };
                })
              };
            });

            // Merge remote and local history, prioritizing remote
            // This is a simple approach - a more sophisticated merge might be needed
            const mergedHistory = [...supabaseWorkouts];
            
            // Add local workouts that aren't in the remote data
            history.forEach(localWorkout => {
              if (!mergedHistory.some(remoteWorkout => remoteWorkout.id === localWorkout.id)) {
                mergedHistory.push(localWorkout);
              }
            });

            // Sort by completion date
            mergedHistory.sort((a, b) => {
              return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
            });

            // Update local cache
            await AsyncStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(mergedHistory));
            
            return mergedHistory;
          }
        } catch (error) {
          console.error('Error fetching workouts from Supabase:', error);
          // Fall back to local data
        }
      }

      return history;
    } catch (error) {
      console.error('Error getting workout history:', error);
      return [];
    }
  }

  /**
   * Save a workout as a template
   */
  async saveWorkoutTemplate(workout: Workout): Promise<void> {
    try {
      // Create template object
      const template: WorkoutTemplate = {
        id: uuidv4(),
        name: workout.name,
        description: workout.notes || '',
        createdAt: new Date().toISOString(),
        exercises: workout.exercises.map(exercise => ({
          id: exercise.id,
          exerciseId: exercise.exerciseId,
          name: exercise.name,
          primaryMuscles: exercise.primaryMuscles,
          equipment: exercise.equipment,
          sets: exercise.sets.length,
          order: workout.exercises.indexOf(exercise)
        }))
      };

      // Get existing templates
      const templatesJson = await AsyncStorage.getItem(KEYS.WORKOUT_TEMPLATES);
      const templates = templatesJson ? JSON.parse(templatesJson) : [];
      
      // Add new template
      templates.push(template);
      
      // Save updated templates
      await AsyncStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(templates));

      // If online, sync with Supabase
      const isConnected = await this.checkConnectivity();
      if (isConnected) {
        await this.syncTemplateToSupabase(template);
      }
    } catch (error) {
      console.error('Error saving workout template:', error);
      throw error;
    }
  }

  /**
   * Sync a template to Supabase
   */
  private async syncTemplateToSupabase(template: WorkoutTemplate): Promise<void> {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Insert template record
      const { data, error } = await supabase
        .from('workout_templates')
        .insert({
          id: template.id,
          user_id: user.id,
          name: template.name,
          description: template.description,
          created_at: template.createdAt
        })
        .select()
        .single();

      if (error) throw error;

      // We would need additional tables for template exercises
      // This is a simplified version
    } catch (error) {
      console.error('Error syncing template to Supabase:', error);
      throw error;
    }
  }

  /**
   * Get all workout templates
   */
  async getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    try {
      // Get from AsyncStorage
      const templatesJson = await AsyncStorage.getItem(KEYS.WORKOUT_TEMPLATES);
      return templatesJson ? JSON.parse(templatesJson) : [];
    } catch (error) {
      console.error('Error getting workout templates:', error);
      return [];
    }
  }

  /**
   * Create a new workout from a template
   */
  async createWorkoutFromTemplate(templateId: string): Promise<Workout> {
    try {
      // Get templates
      const templates = await this.getWorkoutTemplates();
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error('Template not found');
      }

      // Build exercise objects for the new workout
      const exercises: WorkoutExercise[] = await Promise.all(
        template.exercises.map(async (templateExercise) => {
          // Get full exercise details from DB if possible
          // For now, just using template data
          return {
            id: uuidv4(),
            exerciseId: templateExercise.exerciseId,
            name: templateExercise.name,
            primaryMuscles: templateExercise.primaryMuscles,
            equipment: templateExercise.equipment,
            sets: Array.from({ length: templateExercise.sets }, (_, i) => ({
              id: uuidv4(),
              setNumber: i + 1,
              weight: null,
              reps: null,
              isComplete: false
            })),
            notes: '',
            isExpanded: true
          };
        })
      );

      // Sort exercises by original order
      exercises.sort((a, b) => {
        const aTemplateEx = template.exercises.find(te => te.exerciseId === a.exerciseId);
        const bTemplateEx = template.exercises.find(te => te.exerciseId === b.exerciseId);
        return (aTemplateEx?.order || 0) - (bTemplateEx?.order || 0);
      });

      // Create new workout
      const newWorkout: Workout = {
        id: uuidv4(),
        name: template.name,
        notes: template.description,
        startedAt: new Date().toISOString(),
        exercises,
        status: 'in_progress'
      };

      // Save as current workout
      await this.saveCurrentWorkout(newWorkout);
      
      return newWorkout;
    } catch (error) {
      console.error('Error creating workout from template:', error);
      throw error;
    }
  }

  /**
   * Calculate and update personal records (PRs)
   */
  async updatePersonalRecords(exercise: WorkoutExercise): Promise<WorkoutExercise> {
    try {
      // Get workout history
      const history = await this.getWorkoutHistory();
      
      // Find previous instances of this exercise
      const previousInstances = history.flatMap(workout => 
        workout.exercises.filter(ex => ex.exerciseId === exercise.exerciseId)
      );
      
      // Check each set for PR
      const updatedSets = exercise.sets.map(set => {
        // Skip incomplete sets or sets without weight/reps
        if (!set.isComplete || !set.weight || !set.reps) {
          return set;
        }
        
        // Calculate volume for this set
        const volume = set.weight * set.reps;
        
        // Check if this is a PR
        const isPR = !previousInstances.some(prevEx => 
          prevEx.sets.some(prevSet => 
            prevSet.weight && prevSet.reps && 
            prevSet.weight * prevSet.reps >= volume
          )
        );
        
        return {
          ...set,
          isPR: isPR
        };
      });
      
      return {
        ...exercise,
        sets: updatedSets
      };
    } catch (error) {
      console.error('Error updating personal records:', error);
      return exercise; // Return original exercise on error
    }
  }

  /**
   * Calculate One Rep Max (1RM) using the Brzycki formula
   */
  calculateOneRepMax(weight: number, reps: number): number {
    // Brzycki formula: 1RM = weight × (36 / (37 - reps))
    // Valid for reps <= 10
    if (reps > 10) {
      reps = 10; // Cap at 10 for better accuracy
    }
    return weight * (36 / (37 - reps));
  }
}

export const workoutService = new WorkoutService();