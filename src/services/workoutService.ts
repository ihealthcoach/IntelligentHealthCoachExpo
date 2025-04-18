import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';
import { 
  Workout, 
  WorkoutExercise, 
  ExerciseSet, 
  WorkoutTemplate,
  SupersetType,
  WorkoutStatus
} from '../types/workout';
import {
  Tables,
  InsertTables,
  WorkoutTemplate as SupabaseWorkoutTemplate,
  TemplateExercise as SupabaseTemplateExercise
} from '../types/supabase';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

// Get the user's local timezone
function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error getting user timezone:', error);
    return 'UTC'; // Fallback to UTC
  }
}

// Format date for display in user's local timezone
function formatLocalDate(isoString: string | null | undefined, formatStr: string = 'yyyy-MM-dd HH:mm'): string {
  if (!isoString) return '';
  
  try {
    const userTimezone = getUserTimezone();
    return formatInTimeZone(
      parseISO(isoString),
      userTimezone,
      formatStr
    );
  } catch (error) {
    console.error('Error formatting date in local time:', error);
    return '';
  }
}

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
 * Loads the current workout from AsyncStorage and enriches with exercise details
 */
async getCurrentWorkout(): Promise<Workout | null> {
  try {
    // DIRECT READ: Always read directly from AsyncStorage
    const workoutJson = await AsyncStorage.getItem(KEYS.CURRENT_WORKOUT);
    
    if (!workoutJson) {
      console.log("No current workout found in AsyncStorage");
      return null;
    }
    
    try {
      const parsedWorkout = JSON.parse(workoutJson);
      console.log("Retrieved workout from AsyncStorage with exercises:", 
        parsedWorkout.exercises.length,
        "First exercise sets:", 
        parsedWorkout.exercises[0]?.sets?.length || 0,
        "Completed sets in first exercise:", 
        parsedWorkout.exercises[0]?.sets?.filter(s => s.isComplete)?.length || 0
      );
      
      // Calculate total completed sets for logging
      const completedSets = parsedWorkout.exercises.reduce((total, ex) => 
        total + ex.sets.filter(s => s.isComplete).length, 0);
      
      console.log(`Loaded workout with ${parsedWorkout.exercises.length} exercises and ${completedSets} completed sets`);
      
      // Sanity check - ensure the workout has valid structure
      if (!parsedWorkout.exercises || !Array.isArray(parsedWorkout.exercises)) {
        console.error("Retrieved workout has invalid structure");
        return null;
      }
      
      return parsedWorkout;
    } catch (parseError) {
      console.error("Error parsing workout JSON:", parseError);
      return null;
    }
  } catch (error) {
    console.error('Error loading current workout:', error);
    return null;
  }
}

  /**
   * Saves the current workout to AsyncStorage
   */
// In workoutService.ts - Enhance saveCurrentWorkout function

async saveCurrentWorkout(workout: Workout): Promise<void> {
  try {
    if (!workout) {
      console.error('DEBUG: Cannot save null workout');
      return;
    }
    
    // Ensure the workout has an ID
    if (!workout.id) {
      workout.id = Date.now().toString();
    }
    
    // Create a fresh deep copy to avoid reference issues
    const workoutCopy = JSON.parse(JSON.stringify(workout));
    
    console.log(`DEBUG: saveCurrentWorkout - ID: ${workoutCopy.id}`);
    
    // Debug details for each exercise's sets
    workoutCopy.exercises.forEach((ex, i) => {
      const completedSets = ex.sets.filter(s => s.isComplete).length;
      console.log(`DEBUG: saveCurrentWorkout - Exercise ${i+1}: ${completedSets}/${ex.sets.length} completed sets`);
      
      // Verify that isComplete flags are intact
      ex.sets.forEach((set, j) => {
        if (set.isComplete === undefined) {
          console.error(`DEBUG: CRITICAL DATA ERROR - Set ${j+1} in Exercise ${i+1} has undefined isComplete`);
          // Fix it
          set.isComplete = false;
        }
      });
    });
    
    // Calculate completed sets for logging
    const completedSets = workoutCopy.exercises.reduce((total, ex) => 
      total + ex.sets.filter(s => s.isComplete).length, 0);
    
    console.log(`DEBUG: saveCurrentWorkout - Saving workout with ${completedSets} completed sets`);
    
    // CRITICAL: Set status to in_progress if exercise data exists
    if (workoutCopy.exercises && workoutCopy.exercises.length > 0) {
      workoutCopy.status = 'in_progress';
      
      // Ensure startedAt exists
      if (!workoutCopy.startedAt) {
        workoutCopy.startedAt = new Date().toISOString();
      }
    }
    
    try {
      // DIRECT SAVE: Use a specific key name for easy debugging
      const storageKey = 'current_workout';
      const workoutJson = JSON.stringify(workoutCopy);
      
      console.log(`DEBUG: About to save workout (${workoutJson.length} bytes)`);
      await AsyncStorage.setItem(storageKey, workoutJson);
      console.log(`DEBUG: AsyncStorage.setItem completed for key: ${storageKey}`);
      
      // Verify the save was successful with detailed error tracking
      try {
        const savedJson = await AsyncStorage.getItem(storageKey);
        if (!savedJson) {
          console.error(`DEBUG: CRITICAL ERROR - Saved workout not found`);
          return;
        }
        
        try {
          const savedData = JSON.parse(savedJson);
          // Check for data integrity
          if (!savedData.exercises || !Array.isArray(savedData.exercises)) {
            console.error(`DEBUG: CRITICAL DATA INTEGRITY ERROR - Saved workout has invalid exercise structure`);
            return;
          }
          
          const savedCompletedSets = savedData.exercises.reduce((total, ex) => 
            total + ex.sets.filter(s => s.isComplete).length, 0);
          
          console.log(`DEBUG: Saved workout verified: ${savedCompletedSets} completed sets`);
          
          // If there's a discrepancy, log it as an error with detailed info
          if (savedCompletedSets !== completedSets) {
            console.error(`DEBUG: DATA INTEGRITY ERROR - Expected ${completedSets} completed sets but found ${savedCompletedSets}`);
            
            // Log specific differences
            savedData.exercises.forEach((ex, i) => {
              const expectedSets = workoutCopy.exercises[i]?.sets.filter(s => s.isComplete).length || 0;
              const actualSets = ex.sets.filter(s => s.isComplete).length;
              
              if (expectedSets !== actualSets) {
                console.error(`DEBUG: Mismatch in Exercise ${i+1}: Expected ${expectedSets} completed sets, found ${actualSets}`);
              }
            });
          }
        } catch (parseError) {
          console.error(`DEBUG: ERROR parsing saved workout: ${parseError}`);
        }
      } catch (verifyError) {
        console.error(`DEBUG: ERROR verifying saved workout: ${verifyError}`);
      }
    } catch (saveError) {
      console.error(`DEBUG: ERROR in AsyncStorage.setItem: ${saveError}`);
      throw saveError;
    }
  } catch (error) {
    console.error('DEBUG: Error in saveCurrentWorkout:', error);
    throw error;
  }
}

  /**
 * Clears the current workout from AsyncStorage
 */
  /*async clearCurrentWorkout(): Promise<void> {
    try {
      console.log("Clearing current workout data from AsyncStorage");
      await AsyncStorage.removeItem(KEYS.CURRENT_WORKOUT);
      console.log("Current workout cleared successfully");
    } catch (error) {
      console.error('Error clearing current workout:', error);
      throw error;
    }
  }*/

    async clearCurrentWorkout(): Promise<void> {
      try {
        console.log("🔴🔴🔴 RESETTING WORKOUT STATE: clearCurrentWorkout() called 🔴🔴🔴");
        console.log("🔴 Call stack:", new Error().stack);
        await AsyncStorage.removeItem(KEYS.CURRENT_WORKOUT);
        console.log("🔴🔴🔴 Current workout CLEARED from AsyncStorage 🔴🔴🔴");
      } catch (error) {
        console.error('❌ Error clearing current workout:', error);
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
        status: 'completed' as WorkoutStatus
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
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
  
      console.log(`Starting sync for workout with ${workout.exercises.length} exercises`);
      
      // Log set counts for debugging
      workout.exercises.forEach((ex, i) => {
        console.log(`Exercise ${i+1}: ${ex.name} has ${ex.sets.length} sets`);
        ex.sets.forEach((set, j) => {
          console.log(`  Set ${j+1}/${ex.sets.length}: completed=${set.isComplete}, id=${set.id.substring(0, 8)}`);
        });
      });
  
      // Use the standard uuidv4 function which should now work
      const workoutId = uuidv4();
      
      // Convert status to the format expected by Supabase
      let dbStatus: string;
      switch(workout.status) {
        case 'not_started':
          dbStatus = 'Started';
          break;
        case 'in_progress':
          dbStatus = 'Started';
          break;
        case 'completed':
          dbStatus = 'Finished';
          break;
        case 'cancelled':
          dbStatus = 'Started';
          break;
        default:
          dbStatus = 'Finished';
      }
  
      // First insert the workout record
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          id: workoutId,
          user_id: user.id,
          name: workout.name,
          notes: workout.notes,
          duration: workout.duration,
          status: dbStatus,
          completed_at: workout.completedAt
        })
        .select()
        .single();
  
      if (workoutError) throw workoutError;
      console.log(`Created workout record with ID: ${workoutData.id}`);
  
      // Then insert each exercise
      for (let exIndex = 0; exIndex < workout.exercises.length; exIndex++) {
        const exercise = workout.exercises[exIndex];
        console.log(`Processing exercise ${exIndex+1}/${workout.exercises.length}: ${exercise.name}`);
        
        // Remove the notes field from the insert operation
        const { data: exerciseDetailData, error: exerciseDetailError } = await supabase
          .from('workout_exercise_details')
          .insert({
            workout_id: workoutData.id,
            exercise_id: exercise.exerciseId,
            order: exercise.order !== undefined ? exercise.order : exIndex,
            superset_id: exercise.supersetId,
            superset_type: exercise.supersetType,
            rest_between_sets: exercise.restBetweenSets
          })
          .select()
          .single();
  
        if (exerciseDetailError) {
          console.error(`Error creating exercise detail: ${exerciseDetailError.message}`);
          throw exerciseDetailError;
        }
        
        console.log(`Created exercise detail with ID: ${exerciseDetailData.id}, now processing ${exercise.sets.length} sets`);
  
        // Create an array to store all set IDs for verification
        const setIds: string[] = [];
  
        // Then insert each set individually, with detailed logging
        for (let setIndex = 0; setIndex < exercise.sets.length; setIndex++) {
          const set = exercise.sets[setIndex];
          console.log(`  Processing set ${setIndex+1}/${exercise.sets.length} (${set.id.substring(0, 8)})`);
          
          try {
            const { data, error: setError } = await supabase
              .from('workout_sets')
              .insert({
                workout_exercise_details_id: exerciseDetailData.id,
                set_number: set.setNumber,
                reps: set.reps,
                weight: set.weight,
                duration: set.restAfter,
                completed: set.isComplete,
                rpe: set.rpe,
                is_pr: set.isPR,
              })
              .select();
  
            if (setError) {
              console.error(`  Error inserting set ${setIndex+1}: ${setError.message}`);
              throw setError;
            } else {
              const setId = data[0].id;
              setIds.push(setId);
              console.log(`  Successfully inserted set ${setIndex+1} with ID: ${setId}`);
            }
          } catch (setInsertError) {
            console.error(`  Exception inserting set ${setIndex+1}: ${setInsertError}`);
            throw setInsertError;
          }
        }
        
        console.log(`Completed processing all ${exercise.sets.length} sets for exercise ${exIndex+1}`);
        
        // VERIFICATION STEP: Query the database to ensure all sets were saved
        const { data: savedSets, error: verifyError } = await supabase
          .from('workout_sets')
          .select('*')
          .eq('workout_exercise_details_id', exerciseDetailData.id);
          
        if (verifyError) {
          console.error(`Error verifying saved sets: ${verifyError.message}`);
        } else {
          console.log(`VERIFICATION: Found ${savedSets.length} sets in database for exercise ${exIndex+1}`);
          
          if (savedSets.length !== exercise.sets.length) {
            console.error(`VERIFICATION FAILED: Expected ${exercise.sets.length} sets but found ${savedSets.length}`);
          }
          
          // Log details of each saved set
          savedSets.forEach((savedSet, i) => {
            console.log(`  Verified set ${i+1}: ID=${savedSet.id}, set_number=${savedSet.set_number}`);
          });
        }
      }
      
      console.log('Workout sync completed successfully');
    } catch (error) {
      console.error('Error syncing workout to Supabase:', error);
      throw error;
    }
  }

/**
 * Try to sync any pending workouts in the background
 * @returns Promise that resolves when sync attempt is complete
 */
async syncPendingWorkouts(): Promise<void> {
  try {
    // Check if online first
    const isConnected = await this.checkConnectivity();
    if (!isConnected) {
      console.log('Cannot sync - device is offline');
      return;
    }

    // Get pending syncs
    const pendingSyncsJson = await AsyncStorage.getItem(KEYS.PENDING_SYNCS);
    if (!pendingSyncsJson) {
      console.log('No pending syncs found');
      return;
    }
    
    let pendingSyncs = JSON.parse(pendingSyncsJson);
    if (pendingSyncs.length === 0) {
      console.log('Pending syncs array is empty');
      return;
    }

    console.log(`Found ${pendingSyncs.length} pending workout(s) to sync`);
    
    // Track successful syncs and failures
    const successfulSyncs: string[] = [];
    const failedSyncs: string[] = [];

    // Try to sync each pending workout
    for (const workout of pendingSyncs) {
      try {
        console.log(`Syncing workout: ${workout.id}`);
        await this.syncWorkoutToSupabase(workout);
        successfulSyncs.push(workout.id);
        console.log(`Successfully synced workout: ${workout.id}`);
      } catch (error) {
        console.error(`Error syncing workout ${workout.id}:`, error);
        failedSyncs.push(workout.id);
        // Continue with next workout
      }
    }

    // Report sync results
    console.log(`Sync results: ${successfulSyncs.length} succeeded, ${failedSyncs.length} failed`);
    
    // Remove successfully synced workouts from pending
    if (successfulSyncs.length > 0) {
      const remainingPendingSyncs = pendingSyncs.filter(
        workout => !successfulSyncs.includes(workout.id)
      );
      
      if (remainingPendingSyncs.length === 0) {
        // If all synced successfully, remove the key entirely
        await AsyncStorage.removeItem(KEYS.PENDING_SYNCS);
        console.log('All workouts synced - removed pending syncs key');
      } else {
        // Otherwise update with remaining workouts
        await AsyncStorage.setItem(KEYS.PENDING_SYNCS, JSON.stringify(remainingPendingSyncs));
        console.log(`Updated pending syncs: ${remainingPendingSyncs.length} remaining`);
      }
    }
    
    // If there were failures, we could potentially schedule a retry later
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
              id, name, notes, duration, status, created_at, updated_at, completed_at,
              workout_exercise_details (
                id, exercise_id, order, notes, superset_id, superset_type, rest_between_sets,
                workout_sets (
                  id, set_number, reps, weight, duration, distance, completed, rpe, is_pr, notes
                )
              )
            `)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false });

          if (!error && data) {
            // Map Supabase data to our workout type
            const supabaseWorkouts: Workout[] = data.map(item => {
              return {
                id: item.id,
                name: item.name || 'Workout',
                notes: item.notes,
                status: item.status as WorkoutStatus,
                startedAt: item.created_at,
                completedAt: item.completed_at,
                duration: item.duration,
                exercises: item.workout_exercise_details.map(detail => {
                  return {
                    id: detail.id,
                    exerciseId: detail.exercise_id,
                    name: 'Loading...', // We would need to get exercise details in a separate query
                    primaryMuscles: '',
                    equipment: '',
                    order: detail.order || 0,
                    notes: detail.notes || '',
                    supersetId: detail.superset_id,
                    supersetType: detail.superset_type as SupersetType,
                    restBetweenSets: detail.rest_between_sets,
                    sets: detail.workout_sets.map(set => {
                      return {
                        id: set.id,
                        setNumber: set.set_number || 0,
                        weight: set.weight,
                        reps: set.reps,
                        isComplete: set.completed,
                        rpe: set.rpe,
                        isPR: set.is_pr,
                        duration: set.duration,
                        distance: set.distance
                      };
                    }),
                    isExpanded: false
                  };
                })
              };
            });

            // Get exercise details for each workout
            for (const workout of supabaseWorkouts) {
              for (const exercise of workout.exercises) {
                if (exercise.exerciseId) {
                  try {
                    const { data: exerciseData, error: exerciseError } = await supabase
                      .from('exercises')
                      .select('name, primary_muscles, equipment')
                      .eq('id', exercise.exerciseId)
                      .single();
                    
                    if (!exerciseError && exerciseData) {
                      exercise.name = exerciseData.name || 'Unknown';
                      exercise.primaryMuscles = exerciseData.primary_muscles || '';
                      exercise.equipment = exerciseData.equipment || '';
                    }
                  } catch (err) {
                    console.error(`Error fetching exercise details for ${exercise.exerciseId}:`, err);
                  }
                }
              }
            }

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
              const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
              const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
              return dateB - dateA;
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

      const enrichedLocalHistory = await Promise.all(
        history.map(workout => this.enrichWorkoutWithExerciseDetails(workout))
      );
      
      return enrichedLocalHistory;
    } catch (error) {
      console.error('Error getting workout history:', error);
      return [];
    }
  }

  /**
   * Save a workout as a template
   */
  async saveWorkoutTemplate(workout: Workout, templateInfo: {
    name: string;
    description?: string;
    category?: string;
    split?: string;
    difficulty?: string;
    tags?: string[];
  }): Promise<void> {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create template object for local storage
      const template: WorkoutTemplate = {
        id: uuidv4(),
        name: templateInfo.name,
        description: templateInfo.description || '',
        createdAt: new Date().toISOString(),
        lastUsed: null,
        exercises: workout.exercises.map((exercise, index) => ({
          id: uuidv4(),
          exerciseId: exercise.exerciseId,
          name: exercise.name,
          primaryMuscles: exercise.primaryMuscles,
          equipment: exercise.equipment,
          sets: exercise.sets.length,
          order: exercise.order !== undefined ? exercise.order : index,
          restBetweenSets: exercise.restBetweenSets,
          supersetId: exercise.supersetId,
          supersetType: exercise.supersetType
        })),
        category: templateInfo.category,
        split: templateInfo.split,
        difficulty: templateInfo.difficulty?.toLowerCase() as "beginner" | "intermediate" | "advanced" | undefined,
        tags: templateInfo.tags,
        isDefault: false
      };

      // Get existing templates from local storage
      const templatesJson = await AsyncStorage.getItem(KEYS.WORKOUT_TEMPLATES);
      const templates = templatesJson ? JSON.parse(templatesJson) : [];
      
      // Add new template
      templates.push(template);
      
      // Save updated templates to local storage
      await AsyncStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(templates));

      // If online, sync with Supabase
      const isConnected = await this.checkConnectivity();
      if (isConnected) {
        await this.syncTemplateToSupabase(template, user.id);
      }

      return;
    } catch (error) {
      console.error('Error saving workout template:', error);
      throw error;
    }
  }

  /**
   * Sync a template to Supabase
   */
  private async syncTemplateToSupabase(template: WorkoutTemplate, userId: string): Promise<void> {
    try {
      // Insert template record
      const { data: templateData, error: templateError } = await supabase
        .from('workout_templates')
        .insert({
          id: template.id,
          user_id: userId,
          name: template.name,
          description: template.description,
          created_at: template.createdAt,
          last_used: template.lastUsed,
          category: template.category,
          split: template.split,
          difficulty: template.difficulty,
          tags: template.tags,
          is_default: template.isDefault
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Insert template exercises
      for (const exercise of template.exercises) {
        const { error: exerciseError } = await supabase
          .from('template_exercises')
          .insert({
            id: exercise.id,
            template_id: template.id,
            exercise_id: exercise.exerciseId,
            name: exercise.name,
            primary_muscles: exercise.primaryMuscles,
            equipment: exercise.equipment,
            sets: exercise.sets,
            order: exercise.order,
            rest_between_sets: exercise.restBetweenSets,
            superset_id: exercise.supersetId,
            superset_type: exercise.supersetType
          });

        if (exerciseError) throw exerciseError;
      }
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
      // Get local templates
      const templatesJson = await AsyncStorage.getItem(KEYS.WORKOUT_TEMPLATES);
      let localTemplates = templatesJson ? JSON.parse(templatesJson) : [];

      // If online, try to sync with Supabase
      const isConnected = await this.checkConnectivity();
      if (isConnected) {
        try {
          // Get the current user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No user found');

          // Fetch templates from Supabase
          const { data: templateData, error: templateError } = await supabase
            .from('workout_templates')
            .select(`
              id, name, description, created_at, last_used, category, split, 
              estimated_duration, difficulty, tags, is_default
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (templateError) throw templateError;

          if (templateData) {
            // For each template, get its exercises
            const remoteTemplates: WorkoutTemplate[] = [];

            for (const templateItem of templateData) {
              // Fetch exercises for this template
              const { data: exercisesData, error: exercisesError } = await supabase
                .from('template_exercises')
                .select('*')
                .eq('template_id', templateItem.id)
                .order('order', { ascending: true });

                if (exercisesError) {
                  console.error(`Error fetching exercises for template ${templateItem.id}:`, exercisesError);
                  continue;
                }

              // Map to our app's type structure
              const mappedTemplate: WorkoutTemplate = {
                id: templateItem.id,
                name: templateItem.name,
                description: templateItem.description || '',
                createdAt: templateItem.created_at,
                lastUsed: templateItem.last_used,
                category: templateItem.category,
                split: templateItem.split,
                estimatedDuration: templateItem.estimated_duration,
                difficulty: templateItem.difficulty?.toLowerCase() as "beginner" | "intermediate" | "advanced" | undefined,
                tags: templateItem.tags,
                isDefault: templateItem.is_default,
                exercises: exercisesData.map(ex => ({
                  id: ex.id,
                  exerciseId: ex.exercise_id,
                  name: ex.name,
                  primaryMuscles: ex.primary_muscles || '',
                  equipment: ex.equipment || '',
                  sets: ex.sets,
                  order: ex.order,
                  restBetweenSets: ex.rest_between_sets,
                  supersetId: ex.superset_id,
                  supersetType: ex.superset_type
                }))
              };

              remoteTemplates.push(mappedTemplate);
            }

            // Merge remote and local templates, prioritizing remote
            const mergedTemplates = [...remoteTemplates];
            
            // Add local templates that aren't in the remote data
            localTemplates.forEach(localTemplate => {
              if (!mergedTemplates.some(remoteTemplate => remoteTemplate.id === localTemplate.id)) {
                mergedTemplates.push(localTemplate);
              }
            });

            // Update local storage with merged data
            await AsyncStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(mergedTemplates));
            
            return mergedTemplates;
          }
        } catch (error) {
          console.error('Error fetching templates from Supabase:', error);
          // Fall back to local templates
        }
      }

      return localTemplates;
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

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Update template's last used timestamp if online
      const isConnected = await this.checkConnectivity();
      if (isConnected) {
        try {
          const lastUsed = new Date().toISOString();
          
          await supabase
            .from('workout_templates')
            .update({ last_used: lastUsed })
            .eq('id', templateId);
            
          // Also update in the local template
          template.lastUsed = lastUsed;
          
          // Update templates in local storage
          const templatesJson = await AsyncStorage.getItem(KEYS.WORKOUT_TEMPLATES);
          let templates = templatesJson ? JSON.parse(templatesJson) : [];
          
          templates = templates.map(t => t.id === templateId ? {...t, lastUsed} : t);
          
          await AsyncStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(templates));
        } catch (err) {
          // Non-critical error, just log it
          console.error('Error updating template last_used:', err);
        }
      }

      // Build exercise objects for the new workout
      const exercises: WorkoutExercise[] = await Promise.all(template.exercises.map(async templateExercise => {
        // Fetch complete exercise details if available
        const exerciseDetails = await this.getExerciseDetails(templateExercise.exerciseId);
        return {
          id: uuidv4(),
          exerciseId: templateExercise.exerciseId,
          name: exerciseDetails?.name || templateExercise.name,
          primaryMuscles: exerciseDetails?.primary_muscles || templateExercise.primaryMuscles || '',
          equipment: exerciseDetails?.equipment || templateExercise.equipment || '',
          order: templateExercise.order,
          supersetId: templateExercise.supersetId,
          supersetType: templateExercise.supersetType,
          restBetweenSets: templateExercise.restBetweenSets,
          targetMuscleGroups: exerciseDetails?.target ? [exerciseDetails.target] : undefined,
          description: exerciseDetails?.description,
          instructions: exerciseDetails?.instructions,
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
      }));

      // Create new workout
      const newWorkout: Workout = {
        id: uuidv4(),
        userId: user.id,
        name: template.name,
        notes: template.description || '',
        startedAt: new Date().toISOString(),
        exercises,
        status: 'not_started' as WorkoutStatus,
        duration: 0,
        plannedDuration: template.estimatedDuration
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
   * Delete a workout template
   */
  async deleteWorkoutTemplate(templateId: string): Promise<void> {
    try {
      // Get existing templates
      const templatesJson = await AsyncStorage.getItem(KEYS.WORKOUT_TEMPLATES);
      let templates = templatesJson ? JSON.parse(templatesJson) : [];
      
      // Filter out the template to be deleted
      templates = templates.filter(template => template.id !== templateId);
      
      // Save updated templates
      await AsyncStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(templates));
      
      // If online, delete from Supabase
      const isConnected = await this.checkConnectivity();
      if (isConnected) {
        // Supabase will automatically delete template_exercises due to CASCADE
        await supabase
          .from('workout_templates')
          .delete()
          .eq('id', templateId);
      }
    } catch (error) {
      console.error('Error deleting workout template:', error);
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

/**
 * Fetch complete exercise details by ID
 * @param exerciseId The ID of the exercise to fetch
 * @returns Complete exercise data or null if not found
 */
async getExerciseDetails(exerciseId: string): Promise<any | null> {
  try {
    // First try to get from Supabase if online
    const isConnected = await this.checkConnectivity();
    
    if (isConnected) {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();
        
      if (error) {
        console.error('Error fetching exercise details:', error);
      }
      
      if (data) {
        // Cache the result in AsyncStorage for offline use
        try {
          const exercisesCache = await AsyncStorage.getItem('exercise_details_cache') || '{}';
          const cache = JSON.parse(exercisesCache);
          cache[exerciseId] = {
            data,
            timestamp: Date.now()
          };
          await AsyncStorage.setItem('exercise_details_cache', JSON.stringify(cache));
        } catch (cacheError) {
          console.error('Error caching exercise data:', cacheError);
        }
        
        return data;
      }
    }
    
    // If offline or Supabase fetch failed, try to get from cache
    try {
      const exercisesCache = await AsyncStorage.getItem('exercise_details_cache') || '{}';
      const cache = JSON.parse(exercisesCache);
      
      if (cache[exerciseId]) {
        console.log(`Using cached data for exercise ${exerciseId}`);
        return cache[exerciseId].data;
      }
    } catch (cacheError) {
      console.error('Error reading exercise cache:', cacheError);
    }
    
    // If we got here, we couldn't get the data
    return null;
  } catch (error) {
    console.error(`Error in getExerciseDetails for ${exerciseId}:`, error);
    return null;
  }
}

/**
 * Enriches a workout with complete exercise details
 * @param workout Workout to enrich
 * @returns Promise resolving to enriched workout
 */
async enrichWorkoutWithExerciseDetails(workout: Workout): Promise<Workout> {
  if (!workout || !workout.exercises) return workout;
  
  // Create a new workout object to avoid mutating the input
  const enrichedWorkout = { ...workout };
  
  // Process each exercise in parallel for efficiency
  const enrichedExercises = await Promise.all(
    workout.exercises.map(async (exercise) => {
      // Skip if already has complete data or no exerciseId
      if (!exercise.exerciseId) return exercise;
      
      // Fetch complete details
      const details = await this.getExerciseDetails(exercise.exerciseId);
      
      if (details) {
        return {
          ...exercise,
          name: details.name || exercise.name,
          primaryMuscles: details.primary_muscles || exercise.primaryMuscles,
          equipment: details.equipment || exercise.equipment,
          targetMuscleGroups: details.target ? [details.target] : undefined,
          description: details.description,
          instructions: details.instructions,
          // Any other fields we want to include
        };
      }
      
      return exercise;
    })
  );
  
  enrichedWorkout.exercises = enrichedExercises;
  return enrichedWorkout;
}

/**
 * Cache the full exercise library for offline use
 * @returns Promise that resolves when caching is complete
 */
/**
 * Cache the full exercise library for offline use
 * @returns Promise that resolves when caching is complete
 */
async cacheExerciseLibrary(): Promise<void> {
  try {
    const isConnected = await this.checkConnectivity();
    if (!isConnected) {
      console.log('Cannot cache exercise library - device is offline');
      return;
    }
    
    console.log('Caching exercise library...');
    
    // First, get the total count of exercises
    const { count, error: countError } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Error counting exercises:', countError);
      return;
    }
    
    const totalCount = count || 0;
    console.log(`Found ${totalCount} total exercises to cache`);
    
    // Use pagination to fetch all exercises
    const PAGE_SIZE = 1000; // Supabase's limit
    let allExercises = [];
    let page = 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    
    console.log(`Will fetch ${totalPages} pages of exercises`);
    
    while (page < totalPages) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      console.log(`Fetching page ${page+1}/${totalPages}: exercises ${from} to ${to}`);
      
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .range(from, to);
        
      if (error) {
        console.error(`Error fetching exercises page ${page+1}:`, error);
        break;
      }
      
      if (data && data.length > 0) {
        console.log(`Received ${data.length} exercises from page ${page+1}`);
        allExercises = [...allExercises, ...data];
        page++;
      } else {
        console.log(`No data received for page ${page+1}, stopping pagination`);
        break;
      }
    }
    
    if (allExercises.length > 0) {
      // Save to AsyncStorage
      await AsyncStorage.setItem('exercise_library_cache', JSON.stringify({
        timestamp: Date.now(),
        exercises: allExercises,
        totalCount
      }));
      
      console.log(`Successfully cached ${allExercises.length} exercises (expected ${totalCount})`);
    } else {
      console.log('No exercises found to cache');
    }
  } catch (error) {
    console.error('Error caching exercise library:', error);
  }
}

/**
 * Get exercise library - tries Supabase first, falls back to cache
 * @returns Array of exercises
 */
async getExerciseLibrary(): Promise<{ exercises: any[], totalCount: number }> {
  try {
    // Check if we have a valid cache first
    try {
      const cacheJson = await AsyncStorage.getItem('exercise_library_cache');
      if (cacheJson) {
        const cache = JSON.parse(cacheJson);
        const cacheAge = Date.now() - (cache.timestamp || 0);
        const CACHE_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        
        // If cache is fresh (less than 7 days old), use it
        if (cache.exercises?.length > 0 && cacheAge < CACHE_THRESHOLD) {
          console.log('Using cached exercise library (age: ' + 
            Math.round(cacheAge / (24 * 60 * 60 * 1000)) + ' days)');
          return { 
            exercises: cache.exercises, 
            totalCount: cache.totalCount || cache.exercises.length 
          };
        }
        console.log('Exercise cache expired, fetching fresh data');
      }
    } catch (cacheError) {
      console.error('Error reading exercise library cache:', cacheError);
    }
    
    // Cache doesn't exist, is invalid, or expired - try to get from Supabase if online
    const isConnected = await this.checkConnectivity();
    
    if (isConnected) {
      try {
        // First, get the total count of exercises
        const { count, error: countError } = await supabase
          .from('exercises')
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          console.error('Error counting exercises:', countError);
        }
        
        const totalCount = count || 0;
        
        // Use pagination to fetch all exercises
        const PAGE_SIZE = 1000; // Supabase's limit
        let allExercises = [];
        let page = 0;
        let hasMore = true;
        
        while (hasMore) {
          const from = page * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;
          
          console.log(`Fetching exercises ${from} to ${to}`);
          
          const { data, error } = await supabase
            .from('exercises')
            .select('*')
            .range(from, to);
            
          if (error) {
            console.error(`Error fetching exercises page ${page}:`, error);
            break;
          }
          
          if (data && data.length > 0) {
            allExercises = [...allExercises, ...data];
            page++;
            
            // Check if we need to fetch more
            if (data.length < PAGE_SIZE || (count !== null && allExercises.length >= count)) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }
        
        console.log(`Fetched ${allExercises.length} exercises total`);
        
        if (allExercises.length > 0) {
          // Update cache with fresh data
          await AsyncStorage.setItem('exercise_library_cache', JSON.stringify({
            timestamp: Date.now(),
            exercises: allExercises,
            totalCount
          }));
          
          return { exercises: allExercises, totalCount };
        }
      } catch (onlineError) {
        console.error('Error accessing Supabase for exercise library:', onlineError);
      }
    }
    
    // If offline or Supabase failed, try to get from cache again (even if expired)
    try {
      const cacheJson = await AsyncStorage.getItem('exercise_library_cache');
      if (cacheJson) {
        const cache = JSON.parse(cacheJson);
        console.log('Falling back to expired cache due to offline/error');
        return { 
          exercises: cache.exercises || [], 
          totalCount: cache.totalCount || cache.exercises?.length || 0 
        };
      }
    } catch (cacheError) {
      console.error('Error reading exercise library cache:', cacheError);
    }
    
    // If all else fails, return empty array
    return { exercises: [], totalCount: 0 };
  } catch (error) {
    console.error('Error in getExerciseLibrary:', error);
    return { exercises: [], totalCount: 0 };
  }
}
}

// Export a singleton instance of the service
export const workoutService = new WorkoutService();