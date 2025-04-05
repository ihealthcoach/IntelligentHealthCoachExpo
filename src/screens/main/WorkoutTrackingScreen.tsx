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
  TextInput
} from 'react-native';
import { 
  Check, 
  Plus, 
  ArrowLeft, 
  MoreHorizontal, 
  Info, 
  Activity, 
  BarChart3, 
  FileText 
} from 'lucide-react-native';
import { MainStackScreenProps } from '../../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Portal, Modal, Button } from 'react-native-paper';

// Get screen dimensions for swipe calculations
const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120; // Minimum distance required for a swipe

type ExerciseSet = {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  isComplete: boolean;
  isPR?: boolean;
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

export default function WorkoutTrackingScreen({ 
  navigation,
  route 
}: MainStackScreenProps<'WorkoutTracking'>) {
  // Get workout data from route params or AsyncStorage
  const [workout, setWorkout] = useState<{
    name: string;
    exercises: WorkoutExercise[];
  } | null>(null);
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [editingWeight, setEditingWeight] = useState<{setId: string, value: string} | null>(null);
  const [editingReps, setEditingReps] = useState<{setId: string, value: string} | null>(null);
  
  // Animation values for swipe
  const position = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    loadWorkoutData();
  }, []);

  useEffect(() => {
    return () => {
      // Use an IIFE for async cleanup
      (async () => {
        // Save data when navigating away
        await saveWorkoutData();
      })();
    };
  }, []);
  
  const loadWorkoutData = async () => {
    try {
      setLoading(true);
      
      // Get the starting exercise index from route params (default to 0)
      const startIndex = route.params?.exerciseIndex || 0;
      setCurrentExerciseIndex(startIndex);
      
      // Try to get workout data from route params first
      if (route.params?.workout) {
        setWorkout(route.params.workout);
      } else {
        // Otherwise load from AsyncStorage
        const savedWorkoutData = await AsyncStorage.getItem('current_workout');
        if (savedWorkoutData) {
          const parsedWorkout = JSON.parse(savedWorkoutData);
          setWorkout(parsedWorkout);
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
  
  // Save workout data to AsyncStorage
  const saveWorkoutData = async () => {
    if (workout) {
      try {
        console.log('Saving workout data to AsyncStorage...');
        // Make sure we're saving the most current version with all tracked sets
        await AsyncStorage.setItem('current_workout', JSON.stringify(workout));
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
        // Move the content horizontally with the finger
        position.setValue(gesture.dx);
      },
      onPanResponderRelease: (event, gesture) => {
        // Check if the swipe was strong enough
        if (gesture.dx < -SWIPE_THRESHOLD) {
          // Swipe left to right (next exercise)
          handleNextExercise();
        } else if (gesture.dx > SWIPE_THRESHOLD) {
          // Swipe right to left (previous exercise)
          handlePreviousExercise();
        } else {
          // Reset position if not swiped far enough
          Animated.spring(position, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Function to handle weight and reps updates
  const updateSetValue = (setId: string, field: 'weight' | 'reps', value: string) => {
    if (!workout) return;
    
    const numValue = value === '' ? null : parseFloat(value);
    
    // Update the specific set in the current exercise
    const updatedExercises = workout.exercises.map((exercise, index) => {
      if (index === currentExerciseIndex) {
        const updatedSets = exercise.sets.map(set => {
          if (set.id === setId) {
            return { ...set, [field]: numValue };
          }
          return set;
        });
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    });
    
    setWorkout(prevWorkout => {
        const newWorkout = { ...prevWorkout!, exercises: updatedExercises };
        // Save immediately after state update
        saveWorkoutData();
        return newWorkout;
      });
    
    // Also save to AsyncStorage to persist changes
    setTimeout(() => {
      saveWorkoutData();
    }, 500);
  };
  
  // Function to mark a set as complete or incomplete
  const toggleSetCompletion = (setId: string) => {
    if (!workout) return;
    
    const updatedExercises = workout.exercises.map((exercise, index) => {
      if (index === currentExerciseIndex) {
        const updatedSets = exercise.sets.map(set => {
          if (set.id === setId) {
            return { ...set, isComplete: !set.isComplete };
          }
          return set;
        });
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    });
    
    setWorkout(prevWorkout => {
        const newWorkout = { ...prevWorkout!, exercises: updatedExercises };
        // Save immediately after state update
        saveWorkoutData();
        return newWorkout;
      });
    
    // Save changes
    setTimeout(() => {
      saveWorkoutData();
    }, 500);
  };
  
  // Function to add a new set to the current exercise
  const addSet = () => {
    if (!workout) return;
    
    const currentExercise = workout.exercises[currentExerciseIndex];
    const lastSet = currentExercise.sets[currentExercise.sets.length - 1];
    const newSetNumber = currentExercise.sets.length + 1;
    
    const newSet: ExerciseSet = {
      id: `${currentExercise.id}-${Date.now()}`,
      setNumber: newSetNumber,
      weight: lastSet?.weight || null,
      reps: lastSet?.reps || null,
      isComplete: false
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
    
    setWorkout({ ...workout, exercises: updatedExercises });
    
    // Save changes
    setTimeout(() => {
      saveWorkoutData();
    }, 500);
  };
  
  // Navigate to the previous exercise
  const handlePreviousExercise = async () => {
    // Save current state first
    await saveWorkoutData();
    
    Animated.timing(position, {
      toValue: width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      position.setValue(-width);
      
      if (currentExerciseIndex > 0) {
        setCurrentExerciseIndex(currentExerciseIndex - 1);
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
    
    // Save current state first
    await saveWorkoutData();
    
    Animated.timing(position, {
      toValue: -width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      position.setValue(width);
      
      if (currentExerciseIndex < workout.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
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
      // In a real app, this would save the completed workout to database
      // For now, just clear the current workout and navigate home
      await AsyncStorage.removeItem('current_workout');
      
      // Navigate to home and reset navigation
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      console.error('Error completing workout:', error);
      Alert.alert('Error', 'Failed to complete workout');
    }
  };
  
  if (!workout || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  const currentExercise = workout.exercises[currentExerciseIndex];
  
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
                {/* Optional superset badge */}
                {currentExercise.notes.includes('Superset') && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Superset</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>{currentExercise.notes || 'Exercise note...'}</Text>
            </View>
          </View>

          {/* Sets Section */}
          <View style={styles.setsSection}>
            {currentExercise.sets.map((set, index) => {
              // Determine if set should be active or inactive
              const isActive = index === currentExercise.sets.findIndex(s => !s.isComplete);
              const isInactive = index > currentExercise.sets.findIndex(s => !s.isComplete) && 
                                currentExercise.sets.some(s => !s.isComplete);
              
              return (
                <View 
                  key={set.id} 
                  style={[
                    styles.setRow, 
                    isActive && styles.activeSetRow,
                    isInactive && styles.inactiveSetRow
                  ]}
                >
                  <View style={styles.setRowContent}>
                    <View style={styles.setNumberContainer}>
                      <Text style={[styles.setNumber, isInactive && styles.inactiveText]}>
                        {String(set.setNumber).padStart(2, '0')}
                      </Text>
                      <Text style={[styles.setType, isInactive && styles.inactiveText]}>Standard set</Text>
                    </View>
                    
                    <View style={styles.setDetailsContainer}>
                      <View style={styles.weightContainer}>
                        {editingWeight && editingWeight.setId === set.id ? (
                          <TextInput
                            style={styles.weightValueInput}
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
                        <Text style={[styles.weightUnit, isInactive && styles.inactiveText]}>kg</Text>
                      </View>
                      
                      <Text style={[styles.multiplySign, isInactive && styles.inactiveText]}>x</Text>
                      
                      <View style={styles.repsContainer}>
                        {editingReps && editingReps.setId === set.id ? (
                          <TextInput
                            style={styles.repsValueInput}
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
                        <Text style={[styles.repsUnit, isInactive && styles.inactiveText]}>reps</Text>
                      </View>
                    </View>
                    
                    {set.isPR ? (
                      <View style={styles.prContainer}>
                        <View style={styles.prBadge}>
                          <Text style={styles.prText}>PR</Text>
                        </View>
                        {set.isComplete && <Check size={20} color="#4F46E5" />}
                      </View>
                    ) : (
                      <TouchableOpacity 
                        onPress={() => toggleSetCompletion(set.id)}
                      >
                        {set.isComplete ? (
                          <Check size={20} color="#4F46E5" />
                        ) : (
                          <View style={styles.emptyCheckbox} />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
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
        </View>
      </Animated.ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Info size={24} color="#FCFDFD" />
            <Text style={styles.navText}>Exercise guide</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Activity size={24} color="#FCFDFD" />
            <Text style={styles.navText}>Previous stats</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <BarChart3 size={24} color="#FCFDFD" />
            <Text style={styles.navText}>One Rep Max</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
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
              onPress={() => setCompletionModalVisible(false)}
            >
              Continue Workout
            </Button>
          </View>
        </Modal>
      </Portal>
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
  },
  header: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 10,
    borderBottomWidth: 0,
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
    paddingBottom: 20,
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
  },
  noteContainer: {
    height: 32,
    justifyContent: 'center',
  },
  noteText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  setsSection: {
    marginBottom: 16,
  },
  setRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  activeSetRow: {
    backgroundColor: '#FCFDFD',
  },
  inactiveSetRow: {
    backgroundColor: 'transparent',
  },
  setRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 37,
  },
  setNumberContainer: {
    width: 142,
    height: 37,
  },
  setNumber: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
  },
  setType: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  setDetailsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightContainer: {
    width: 50,
    height: 37,
    alignItems: 'center',
  },
  weightValue: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
  },
  weightValueInput: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
    width: 50,
    padding: 0,
  },
  weightUnit: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  multiplySign: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  repsContainer: {
    width: 50,
    height: 37,
    alignItems: 'center',
  },
  repsValue: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
  },
  repsValueInput: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
    width: 50,
    padding: 0,
  },
  repsUnit: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  emptyValue: {
    color: '#9CA3AF',
  },
  inactiveText: {
    color: '#D1D5DB',
  },
  emptyCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
  },
  prContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prBadge: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  addSetContainer: {
    paddingHorizontal: 16,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCFDFD',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  addSetText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
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
});