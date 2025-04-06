import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Alert
} from 'react-native';
import { 
  ArrowLeft, 
  Bookmark, 
  MoreHorizontal, 
  Plus, 
  Trash2, 
  XIcon 
} from 'lucide-react-native';
import { MainStackScreenProps } from '../../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for workout exercises
type ExerciseSet = {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  isComplete: boolean;
};

type WorkoutExercise = {
  id: string;
  exerciseId: string;
  name: string;
  primaryMuscles: string;
  equipment: string;
  sets: ExerciseSet[];
  notes: string;
  isExpanded: boolean;
  completed?: boolean;
};

export default function WorkoutExerciseOverview({ navigation }: MainStackScreenProps<'WorkoutExerciseOverview'>) {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [workoutName, setWorkoutName] = useState<string>('Workout');
  const [loading, setLoading] = useState(true);
  const [workoutStarted, setWorkoutStarted] = useState(false);

  useEffect(() => {
    loadWorkoutData();
  }, []);

  const loadWorkoutData = async () => {
    try {
      setLoading(true);
      // Try to load from AsyncStorage
      const savedWorkout = await AsyncStorage.getItem('current_workout');
      
      if (savedWorkout) {
        const parsedWorkout = JSON.parse(savedWorkout);
        setWorkoutName(parsedWorkout.name || 'Workout');
        setExercises(parsedWorkout.exercises || []);
        
        // Check if workout has been started by seeing if any sets are completed
        const hasStarted = parsedWorkout.exercises?.some(exercise => 
          exercise.sets?.some(set => set.isComplete)
        );
        setWorkoutStarted(hasStarted);
      } else {
        // If no saved workout exists, initialize with empty array
        setExercises([]);
        setWorkoutStarted(false);
      }
    } catch (error) {
      console.error('Error loading workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWorkout = async () => {
    try {
      await AsyncStorage.setItem('current_workout', JSON.stringify({
        name: workoutName,
        exercises: exercises
      }));
      Alert.alert('Success', 'Workout saved as template');
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout template');
    }
  };

  const removeExercise = async (id: string) => {
    // Filter out the exercise to be removed
    const updatedExercises = exercises.filter(exercise => exercise.id !== id);
    
    // Update state
    setExercises(updatedExercises);
    
    // Update AsyncStorage with the updated exercises list
    try {
      await AsyncStorage.setItem('current_workout', JSON.stringify({
        name: workoutName,
        exercises: updatedExercises
      }));
    } catch (error) {
      console.error('Error saving updated workout:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const handleExerciseClick = (exerciseIndex) => {
    // Save current workout data
    AsyncStorage.setItem('current_workout', JSON.stringify({
      name: workoutName,
      exercises: exercises
    }));
    
    // Set workout as started
    setWorkoutStarted(true);
    
    // Navigate to workout tracking with the selected exercise
    navigation.navigate('WorkoutTracking', {
      exerciseIndex: exerciseIndex,
      workout: {
        id: workout?.id || Date.now().toString(),
        name: workoutName,
        exercises: exercises.map((exercise, index) => ({
          ...exercise,
          order: exercise.order !== undefined ? exercise.order : index // Add order property if missing
        })),
        status: workout?.status || 'in_progress',
        startedAt: workout?.startedAt || new Date().toISOString()
      }
    });

  const startWorkout = async () => {
    // Save current workout data
    await AsyncStorage.setItem('current_workout', JSON.stringify({
      name: workoutName,
      exercises: exercises
    }));
    
    // Check if we have exercises to track
    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Please add exercises before starting your workout.');
      return;
    }

    setWorkoutStarted(true);
    
    // Navigate to the workout tracking screen
    navigation.navigate('WorkoutTracking', {
      exerciseIndex: exerciseIndex,
      workout: {
        id: workout?.id || Date.now().toString(),
        name: workoutName,
        exercises: exercises.map((exercise, index) => ({
          ...exercise,
          order: exercise.order !== undefined ? exercise.order : index // Add order property if missing
        })),
        status: workout?.status || 'in_progress',
        startedAt: workout?.startedAt || new Date().toISOString()
      }
    });

  const renderExerciseItem = (exercise, index) => {
    // Calculate completed sets
    const totalSets = exercise.sets.length;
    const completedSets = exercise.sets.filter(set => set.isComplete).length;
    const allSetsCompleted = totalSets > 0 && completedSets === totalSets;
    
    if (allSetsCompleted) {
      return (
        <View key={`${exercise.id}-${index}`} style={styles.exerciseItem}>
          <View style={styles.exerciseContent}>
            {/* Exercise image placeholder */}
            <View style={styles.exerciseImage} />
            
            <View style={styles.exerciseDetails}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseProgress}>{exercise.primaryMuscles}</Text>
            </View>
          </View>
          <View style={styles.completedContainer}>
            <Text style={styles.completedText}>Completed</Text>
          </View>
        </View>
      );
    } else {
      return (
        <TouchableOpacity 
          key={`${exercise.id}-${index}`} 
          style={styles.exerciseItem}
          onPress={() => handleExerciseClick(index)}
        >
          <View style={styles.exerciseContent}>
            {/* Use a placeholder for demo purposes */}
            <View style={styles.exerciseImage} />
            
            <View style={styles.exerciseDetails}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <View style={styles.tagsContainer}>
                <Text style={styles.exerciseProgress}>
                  {workoutStarted 
                    ? `${completedSets} of ${totalSets} sets completed` 
                    : exercise.primaryMuscles}
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering parent onPress
              /* Show options menu */
            }}
          >
            <MoreHorizontal size={20} color="#9EA5AF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering parent onPress
              removeExercise(exercise.id);
            }}
          >
            <View style={styles.deleteButtonInner}>
              <Trash2 size={20} color="#4B5563" />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.saveTemplateButton}
              onPress={saveWorkout}
            >
              <Text style={styles.saveTemplateText}>Save as template</Text>
              <Bookmark size={20} color="#FCFDFD" />
            </TouchableOpacity>
            
            <TouchableOpacity>
              <MoreHorizontal size={24} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Headline */}
          <View style={styles.headlineContainer}>
            <Text style={styles.headline}>{workoutName}</Text>
            <View style={styles.subtitleSection}>
              <Text style={styles.subtitle}>
                {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'} added to your workout
              </Text>
            </View>
          </View>

          {/* Exercise List */}
          {exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No exercises added yet. Add exercises to start your workout.
              </Text>
            </View>
          ) : (
            <View style={styles.exerciseList}>
              {exercises.map((exercise, index) => renderExerciseItem(exercise, index))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        {!workoutStarted && (
          <TouchableOpacity 
            style={[
              styles.startButton,
              exercises.length === 0 && styles.disabledButton
            ]}
            onPress={startWorkout}
            disabled={exercises.length === 0}
          >
            <Text style={styles.startButtonText}>Start workout</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.addButton, workoutStarted && styles.fullWidthButton]}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Exercises' })}
        >
          <Plus size={24} color="#374151" />
          <Text style={styles.addButtonText}>Add exercise</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveTemplateButton: {
    backgroundColor: '#111827',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  saveTemplateText: {
    color: '#FCFDFD',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 120, // Extra space for bottom buttons
  },
  headlineContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  headline: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 0,
  },
  subtitleSection: {
    marginTop: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#9EA5AF',
  },
  emptyState: {
    padding: 24,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  exerciseList: {
    paddingHorizontal: 16,
    gap: 6,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    marginBottom: 6,
  },
  exerciseContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseImage: {
    width: 68,
    height: 68,
    backgroundColor: '#333',
  },
  exerciseDetails: {
    flex: 1,
    justifyContent: 'center',
    height: 34,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 0,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseProgress: {
    fontSize: 11,
    color: '#9EA5AF',
  },
  completedContainer: {
    width: 60,
    height: 68,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  completedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
    textAlign: 'right',
  },
  moreButton: {
    width: 36,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  startButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 5,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#A5B4FC',
  },
  startButtonText: {
    color: '#FCFDFD',
    fontSize: 16,
    fontWeight: '500',
  },
  fullWidthButton: {
    width: '100%',
  },
  addButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  addButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
});