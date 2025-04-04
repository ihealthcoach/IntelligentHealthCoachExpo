import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { 
  Text, 
  Card, 
  IconButton, 
  Button, 
  TextInput, 
  Dialog, 
  Portal
} from 'react-native-paper';
import { 
  ArrowLeft, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  MoreVertical,
  Save
} from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

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
};

export default function WorkoutExerciseOverview({ 
    navigation, 
    route 
  }: NativeStackScreenProps<MainStackParamList, 'WorkoutExerciseOverview'>) {
    const { user } = useAuth();
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [workoutName, setWorkoutName] = useState<string>('New Workout');
  const [workoutNotes, setWorkoutNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [noteDialogVisible, setNoteDialogVisible] = useState<boolean>(false);
  const [currentExerciseNote, setCurrentExerciseNote] = useState<{ id: string, note: string } | null>(null);
  const [editMenuVisible, setEditMenuVisible] = useState<{ id: string, visible: boolean } | null>(null);

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
        setWorkoutName(parsedWorkout.name || 'New Workout');
        setWorkoutNotes(parsedWorkout.notes || '');
        setExercises(parsedWorkout.exercises || []);
      } else {
        // If no saved workout exists, create a new one with sample data
        // You could also redirect back to workout creation
        const sampleExercises: WorkoutExercise[] = [
          {
            id: '1',
            exerciseId: '101',
            name: 'Barbell Bench Press',
            primaryMuscles: 'Chest',
            equipment: 'Barbell',
            sets: [
              { id: '1-1', setNumber: 1, weight: 135, reps: 10, isComplete: false },
              { id: '1-2', setNumber: 2, weight: 145, reps: 8, isComplete: false },
              { id: '1-3', setNumber: 3, weight: 155, reps: 6, isComplete: false }
            ],
            notes: '',
            isExpanded: true
          },
          {
            id: '2',
            exerciseId: '102',
            name: 'Dumbbell Shoulder Press',
            primaryMuscles: 'Shoulders',
            equipment: 'Dumbbells',
            sets: [
              { id: '2-1', setNumber: 1, weight: 25, reps: 12, isComplete: false },
              { id: '2-2', setNumber: 2, weight: 30, reps: 10, isComplete: false },
              { id: '2-3', setNumber: 3, weight: 30, reps: 10, isComplete: false }
            ],
            notes: 'Focus on full range of motion',
            isExpanded: true
          }
        ];
        
        setExercises(sampleExercises);
        
        // Save this sample workout to AsyncStorage
        await AsyncStorage.setItem('current_workout', JSON.stringify({
          name: workoutName,
          notes: workoutNotes,
          exercises: sampleExercises
        }));
      }
    } catch (error) {
      console.error('Error loading workout data:', error);
      Alert.alert('Error', 'Failed to load workout data');
    } finally {
      setLoading(false);
    }
  };

  const saveWorkout = async () => {
    if (!user) {
      Alert.alert('Please sign in to save your workout');
      return;
    }
    
    try {
      setSaving(true);
      
      // Save to AsyncStorage first
      await AsyncStorage.setItem('current_workout', JSON.stringify({
        name: workoutName,
        notes: workoutNotes,
        exercises: exercises
      }));
      
      // In a real app, you would also save to Supabase here
      // Example code for saving to Supabase:
      /*
      // 1. First create the workout record
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          name: workoutName,
          date: new Date().toISOString(),
          notes: workoutNotes,
          completed: false
        })
        .select()
        .single();
      
      if (workoutError) throw workoutError;
      
      const workoutId = workoutData.id;
      
      // 2. Then save each exercise with its details
      for (const exercise of exercises) {
        // Add exercise to workout_exercise_details
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('workout_exercise_details')
          .insert({
            workout_id: workoutId,
            exercise_id: exercise.exerciseId,
            order: exercises.indexOf(exercise) + 1,
            notes: exercise.notes
          })
          .select()
          .single();
          
        if (exerciseError) throw exerciseError;
        
        // Add sets for this exercise
        const setsToInsert = exercise.sets.map(set => ({
          workout_exercise_id: exerciseData.id,
          set_number: set.setNumber,
          weight: set.weight,
          reps: set.reps,
          completed: set.isComplete
        }));
        
        const { error: setsError } = await supabase
          .from('workout_sets')
          .insert(setsToInsert);
          
        if (setsError) throw setsError;
      }
      */
      
      Alert.alert('Success', 'Workout saved successfully');
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  const toggleExerciseExpansion = (id: string) => {
    setExercises(exercises.map(exercise => 
      exercise.id === id 
        ? { ...exercise, isExpanded: !exercise.isExpanded } 
        : exercise
    ));
  };

  const markSetComplete = (exerciseId: string, setId: string, isComplete: boolean) => {
    setExercises(exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        const updatedSets = exercise.sets.map(set => 
          set.id === setId ? { ...set, isComplete } : set
        );
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    }));
  };

  const updateSetValues = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: number | null) => {
    setExercises(exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        const updatedSets = exercise.sets.map(set => 
          set.id === setId ? { ...set, [field]: value } : set
        );
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    }));
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        const lastSet = exercise.sets[exercise.sets.length - 1];
        const newSetNumber = exercise.sets.length + 1;
        const newSet: ExerciseSet = {
          id: `${exerciseId}-${newSetNumber}`,
          setNumber: newSetNumber,
          weight: lastSet?.weight || null,
          reps: lastSet?.reps || null,
          isComplete: false
        };
        return { ...exercise, sets: [...exercise.sets, newSet] };
      }
      return exercise;
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        // Filter out the set to remove
        const updatedSets = exercise.sets.filter(set => set.id !== setId);
        // Re-number the remaining sets
        const renumberedSets = updatedSets.map((set, index) => ({
          ...set,
          setNumber: index + 1
        }));
        return { ...exercise, sets: renumberedSets };
      }
      return exercise;
    }));
  };

  const removeExercise = (exerciseId: string) => {
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setExercises(exercises.filter(exercise => exercise.id !== exerciseId));
          }
        }
      ]
    );
  };

  const openNoteDialog = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      setCurrentExerciseNote({ id: exerciseId, note: exercise.notes });
      setNoteDialogVisible(true);
    }
  };

  const saveExerciseNote = () => {
    if (currentExerciseNote) {
      setExercises(exercises.map(exercise => 
        exercise.id === currentExerciseNote.id 
          ? { ...exercise, notes: currentExerciseNote.note } 
          : exercise
      ));
      setNoteDialogVisible(false);
      setCurrentExerciseNote(null);
    }
  };

  const toggleEditMenu = (exerciseId: string) => {
    if (editMenuVisible && editMenuVisible.id === exerciseId) {
      setEditMenuVisible(null);
    } else {
      setEditMenuVisible({ id: exerciseId, visible: true });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={36} color="#007AFF" />
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          {isEditingName ? (
            <TextInput
              value={workoutName}
              onChangeText={setWorkoutName}
              style={styles.titleInput}
              onBlur={() => setIsEditingName(false)}
              autoFocus
              onSubmitEditing={() => setIsEditingName(false)}
            />
          ) : (
            <Text style={styles.title} onPress={() => setIsEditingName(true)}>
              {workoutName}
            </Text>
          )}
        </View>
        
        <Button 
          mode="contained" 
          onPress={saveWorkout}
          loading={saving}
          icon={() => <Save size={16} color="#fff" />}
          style={styles.saveButton}
        >
          Save
        </Button>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content}>
        {/* Workout Notes */}
        <Card style={styles.notesCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Workout Notes</Text>
            <TextInput
              value={workoutNotes}
              onChangeText={setWorkoutNotes}
              placeholder="Add notes for this workout"
              multiline
              style={styles.notesInput}
            />
          </Card.Content>
        </Card>
        
        {/* Exercise List */}
        <View style={styles.exerciseListContainer}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          
          {exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No exercises added yet. Go to the library to add exercises.
              </Text>
              <Button
  mode="contained"
  icon={() => <Plus size={16} color="#fff" />}
  onPress={() => navigation.navigate('MainTabs', { screen: 'Exercises' })}
  style={styles.addExerciseButton}
>
  Add Exercises
</Button>
            </View>
          ) : (
            exercises.map(exercise => (
              <Card key={exercise.id} style={styles.exerciseCard}>
                <Card.Content>
                  {/* Exercise Header */}
                  <View style={styles.exerciseHeader}>
                    <TouchableOpacity 
                      style={styles.exerciseTitle}
                      onPress={() => toggleExerciseExpansion(exercise.id)}
                    >
                      <View>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseDetails}>
                          {exercise.primaryMuscles}, {exercise.equipment}
                        </Text>
                        {exercise.notes ? (
                          <Text 
                            style={styles.exerciseNotes}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            Note: {exercise.notes}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                    
                    <View style={styles.exerciseActions}>
                      <TouchableOpacity 
                        onPress={() => toggleEditMenu(exercise.id)}
                        style={styles.menuButton}
                      >
                        <MoreVertical size={20} color="#4B4B4B" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        onPress={() => toggleExerciseExpansion(exercise.id)}
                        style={styles.expandButton}
                      >
                        {exercise.isExpanded ? (
                          <ChevronUp size={20} color="#4B4B4B" />
                        ) : (
                          <ChevronDown size={20} color="#4B4B4B" />
                        )}
                      </TouchableOpacity>
                    </View>
                    
                    {/* Edit Menu PopOver */}
                    {editMenuVisible?.id === exercise.id && (
                      <View style={styles.editMenu}>
                        <TouchableOpacity 
                          style={styles.editMenuItem}
                          onPress={() => {
                            toggleEditMenu(exercise.id);
                            openNoteDialog(exercise.id);
                          }}
                        >
                          <Edit3 size={16} color="#4B4B4B" />
                          <Text style={styles.editMenuText}>Add/Edit Note</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.editMenuItem}
                          onPress={() => {
                            toggleEditMenu(exercise.id);
                            removeExercise(exercise.id);
                          }}
                        >
                          <Trash2 size={16} color="#E53E3E" />
                          <Text style={[styles.editMenuText, styles.deleteText]}>
                            Remove Exercise
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  
                  {/* Exercise Sets */}
                  {exercise.isExpanded && (
                    <View style={styles.exerciseSets}>
                      {/* Set Headers */}
                      <View style={styles.setHeader}>
                        <Text style={[styles.setHeaderText, styles.setColumn]}>SET</Text>
                        <Text style={[styles.setHeaderText, styles.weightColumn]}>WEIGHT</Text>
                        <Text style={[styles.setHeaderText, styles.repsColumn]}>REPS</Text>
                        <Text style={[styles.setHeaderText, styles.doneColumn]}>DONE</Text>
                      </View>
                      
                      {/* Sets */}
                      {exercise.sets.map(set => (
                        <View key={set.id} style={styles.setRow}>
                          <View style={styles.setColumn}>
                            <Text style={styles.setText}>{set.setNumber}</Text>
                          </View>
                          
                          <View style={styles.weightColumn}>
                            <TextInput
                              value={set.weight?.toString() || ''}
                              onChangeText={(text) => {
                                const value = text === '' ? null : parseFloat(text);
                                updateSetValues(exercise.id, set.id, 'weight', value);
                              }}
                              keyboardType="numeric"
                              style={styles.setInput}
                              placeholder="0"
                            />
                          </View>
                          
                          <View style={styles.repsColumn}>
                            <TextInput
                              value={set.reps?.toString() || ''}
                              onChangeText={(text) => {
                                const value = text === '' ? null : parseInt(text, 10);
                                updateSetValues(exercise.id, set.id, 'reps', value);
                              }}
                              keyboardType="numeric"
                              style={styles.setInput}
                              placeholder="0"
                            />
                          </View>
                          
                          <View style={styles.doneColumn}>
                            <TouchableOpacity
                              style={[
                                styles.checkBox,
                                set.isComplete ? styles.checkBoxComplete : {}
                              ]}
                              onPress={() => markSetComplete(exercise.id, set.id, !set.isComplete)}
                            >
                              {set.isComplete && (
                                <View style={styles.checkMark} />
                              )}
                            </TouchableOpacity>
                          </View>
                          
                          {/* Only show remove button if there's more than one set */}
                          {exercise.sets.length > 1 && (
                            <TouchableOpacity
                              style={styles.removeSetButton}
                              onPress={() => removeSet(exercise.id, set.id)}
                            >
                              <Trash2 size={16} color="#E53E3E" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      
                      {/* Add Set Button */}
                      <TouchableOpacity
                        style={styles.addSetButton}
                        onPress={() => addSet(exercise.id)}
                      >
                        <Plus size={16} color="#007AFF" />
                        <Text style={styles.addSetText}>Add Set</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))
          )}
          
          {/* Add Exercise Button */}
          {exercises.length > 0 && (
            <Button
  mode="outlined"
  icon={() => <Plus size={16} color="#007AFF" />}
  onPress={() => navigation.navigate('MainTabs', { screen: 'Exercises' })}
  style={styles.addMoreExercisesButton}
>
  Add More Exercises
</Button>
          )}
        </View>
      </ScrollView>
      
      {/* Note Dialog */}
      <Portal>
        <Dialog 
          visible={noteDialogVisible} 
          onDismiss={() => setNoteDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Exercise Notes</Dialog.Title>
          <Dialog.Content>
            <TextInput
              value={currentExerciseNote?.note || ''}
              onChangeText={(text) => {
                if (currentExerciseNote) {
                  setCurrentExerciseNote({
                    ...currentExerciseNote,
                    note: text
                  });
                }
              }}
              placeholder="Add notes for this exercise"
              multiline
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNoteDialogVisible(false)}>Cancel</Button>
            <Button onPress={saveExerciseNote}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  titleInput: {
    fontSize: 20,
    height: 40,
    padding: 0,
    margin: 0,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  notesCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111827',
  },
  notesInput: {
    minHeight: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  exerciseListContainer: {
    marginBottom: 50,
  },
  exerciseCard: {
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
  },
  exerciseTitle: {
    flex: 1,
    paddingVertical: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  exerciseNotes: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 4,
    marginRight: 4,
  },
  expandButton: {
    padding: 4,
  },
  editMenu: {
    position: 'absolute',
    top: 32,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
    padding: 8,
    zIndex: 10,
    width: 180,
  },
  editMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  editMenuText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  deleteText: {
    color: '#E53E3E',
  },
  exerciseSets: {
    marginTop: 12,
  },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 4,
  },
  setHeaderText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  setColumn: {
    width: 40,
    alignItems: 'center',
  },
  setText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  weightColumn: {
    flex: 2,
    marginHorizontal: 4,
  },
  repsColumn: {
    flex: 2,
    marginHorizontal: 4,
  },
  doneColumn: {
    width: 50,
    alignItems: 'center',
  },
  setInput: {
    height: 36,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 0,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxComplete: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkMark: {
    width: 14,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  removeSetButton: {
    padding: 8,
    marginLeft: 8,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addSetText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  emptyState: {
    padding: 24,
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
    marginBottom: 16,
  },
  addExerciseButton: {
    backgroundColor: '#007AFF',
  },
  addMoreExercisesButton: {
    marginTop: 16,
    borderColor: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F7',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  dialogInput: {
    minHeight: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  }
});