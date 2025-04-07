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
  Image,
  TextInput,
  FlatList,
  Dimensions,
  Platform
} from 'react-native';
import { 
  ArrowLeft, 
  Bookmark, 
  MoreHorizontal, 
  Plus, 
  Trash2, 
  Clock, 
  Calendar, 
  BarChart2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Info,
  Settings,
  Edit,
  Save,
  Play,
  DollarSign,
  ChevronRight,
  Star,
  StarHalf,
  Check
} from 'lucide-react-native';
import { Portal, Modal, Button, Divider, Badge } from 'react-native-paper';
import { MainStackScreenProps } from '../../types/navigation';
import { workoutService } from '../../services/workoutService';
import { useAuth } from '../../contexts/AuthContext';
import {
  Workout,
  WorkoutExercise,
  ExerciseSet,
  WorkoutTemplate,
  SupersetType,
  WorkoutStatus
} from '../../types/workout';
import * as Haptics from 'expo-haptics';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';

const { width } = Dimensions.get('window');

export default function WorkoutOverviewScreen({ navigation }: MainStackScreenProps<'WorkoutExerciseOverview'>) {
  const { user } = useAuth();
  
  // Workout state
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  
  // UI state
  const [editingName, setEditingName] = useState(false);
  const [workoutName, setWorkoutName] = useState('New Workout');
  const [exerciseMenuOpen, setExerciseMenuOpen] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [saveAsTemplateModalVisible, setSaveAsTemplateModalVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  
  // Templates
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Load data when the component mounts
  useEffect(() => {
    loadWorkoutData();
    loadWorkoutTemplates();
    
    // Animate component in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    return () => {
      // Clean up or save data when unmounting
    };
  }, []);
  
  // Load workout data from service
  const loadWorkoutData = async () => {
    try {
      setLoading(true);
      const currentWorkout = await workoutService.getCurrentWorkout();
      
      if (currentWorkout) {
        setWorkout(currentWorkout);
        setWorkoutName(currentWorkout.name || 'New Workout');
        
        // Check if workout has been started
        const hasStarted = currentWorkout.exercises?.some(exercise => 
          exercise.sets?.some(set => set.isComplete)
        );
        setWorkoutStarted(hasStarted);
      } else {
        // Initialize with a new workout
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
  
  // Load workout templates
  const loadWorkoutTemplates = async () => {
    try {
      const templates = await workoutService.getWorkoutTemplates();
      setWorkoutTemplates(templates);
    } catch (error) {
      console.error('Error loading workout templates:', error);
    }
  };
  
  // Update workout name
  const updateWorkoutName = async () => {
    if (!workout) return;
    
    try {
      const updatedWorkout = { ...workout, name: workoutName };
      setWorkout(updatedWorkout);
      await workoutService.saveCurrentWorkout(updatedWorkout);
      setEditingName(false);
    } catch (error) {
      console.error('Error updating workout name:', error);
    }
  };
  
  // Remove an exercise from the workout
  const removeExercise = async (exerciseId: string) => {
    if (!workout) return;
    
    try {
      // Filter out the exercise to be removed
      const updatedExercises = workout.exercises.filter(exercise => exercise.id !== exerciseId);
      
      // Update workout
      const updatedWorkout = { ...workout, exercises: updatedExercises };
      setWorkout(updatedWorkout);
      
      // Save to service
      await workoutService.saveCurrentWorkout(updatedWorkout);
      
      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Error removing exercise:', error);
      Alert.alert('Error', 'Failed to remove exercise');
    }
  };
  
  // Handle exercise click to navigate to tracking
  const handleExerciseClick = (exerciseIndex: number) => {
    if (!workout) return;
    
    // Save current workout data first
    workoutService.saveCurrentWorkout(workout);
    
    // Set workout as started
    setWorkoutStarted(true);
    
    // Navigate to workout tracking with the selected exercise
    navigation.navigate('WorkoutTracking', {
      exerciseIndex: exerciseIndex,
      workout: workout
    });
  };
  
  // Start the workout
  const startWorkout = async () => {
    if (!workout) return;
    
    // Check if we have exercises to track
    if (workout.exercises.length === 0) {
      Alert.alert('No Exercises', 'Please add exercises before starting your workout.');
      return;
    }
    
    try {
      // Update workout status
    const updatedWorkout = {
    ...workout,
    status: WorkoutStatus.IN_PROGRESS,
    startedAt: new Date().toISOString()
    };
      
      setWorkout(updatedWorkout);
      setWorkoutStarted(true);
      
      // Save to service
      await workoutService.saveCurrentWorkout(updatedWorkout);
      
      // Navigate to the workout tracking screen
      navigation.navigate('WorkoutTracking', {
        exerciseIndex: 0,
        workout: updatedWorkout
      });
    } catch (error) {
      console.error('Error starting workout:', error);
      Alert.alert('Error', 'Failed to start workout');
    }
  };
  
  // Reorder exercises
  const reorderExercises = async (data: WorkoutExercise[]) => {
    if (!workout) return;
    
    // Update the order property of each exercise
    const updatedExercises = data.map((exercise, index) => ({
      ...exercise,
      order: index
    }));
    
    // Update workout
    const updatedWorkout = { ...workout, exercises: updatedExercises };
    setWorkout(updatedWorkout);
    
    // Save to service
    await workoutService.saveCurrentWorkout(updatedWorkout);
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Save workout as template
  const saveAsTemplate = async () => {
    if (!workout) return;
    
    try {
      // Close the modal
      setSaveAsTemplateModalVisible(false);
      
      // Check if name is provided
      if (!templateName.trim()) {
        Alert.alert('Template Name Required', 'Please provide a name for your template.');
        return;
      }
      
      // Create a copy of the current workout with the template name
      const templateWorkout: Workout = {
        ...workout,
        name: templateName,
        notes: templateDescription,
        // Add template metadata
        template: true,
        split: templateCategory || undefined,
      };
      
      // Save as template using the service
      await workoutService.saveWorkoutTemplate(templateWorkout);
      
      // Show success message
      Alert.alert('Success', 'Workout saved as template');
      
      // Refresh templates
      loadWorkoutTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      Alert.alert('Error', 'Failed to save workout template');
    }
  };
  
  // Load a workout from template
  const loadFromTemplate = async (templateId: string) => {
    try {
      // Check if current workout has exercises
      if (workout && workout.exercises.length > 0) {
        Alert.alert(
          'Replace Current Workout?',
          'Loading a template will replace your current workout. Continue?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Replace',
              onPress: async () => {
                // Create new workout from template
                const newWorkout = await workoutService.createWorkoutFromTemplate(templateId);
                setWorkout(newWorkout);
                setWorkoutName(newWorkout.name);
                setWorkoutStarted(false);
                setShowTemplateModal(false);
              }
            }
          ]
        );
      } else {
        // Create new workout from template
        const newWorkout = await workoutService.createWorkoutFromTemplate(templateId);
        setWorkout(newWorkout);
        setWorkoutName(newWorkout.name);
        setWorkoutStarted(false);
        setShowTemplateModal(false);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      Alert.alert('Error', 'Failed to load workout template');
    }
  };
  
  // Create superset with selected exercises
  const createSuperset = async (exerciseIds: string[]) => {
    if (!workout || exerciseIds.length < 2) return;
    
    try {
      // Generate a unique superset ID
      const supersetId = `superset-${Date.now()}`;
      
      // Update exercises to be in the superset
      const updatedExercises = workout.exercises.map(exercise => {
        if (exerciseIds.includes(exercise.id)) {
          return {
            ...exercise,
            supersetId: supersetId,
            supersetType: SupersetType.SUPERSET
          };
        }
        return exercise;
      });
      
      // Update workout
      const updatedWorkout = { ...workout, exercises: updatedExercises };
      setWorkout(updatedWorkout);
      
      // Save to service
      await workoutService.saveCurrentWorkout(updatedWorkout);
      
      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Show confirmation
      Alert.alert('Success', 'Superset created');
    } catch (error) {
      console.error('Error creating superset:', error);
      Alert.alert('Error', 'Failed to create superset');
    }
  };
  
  // Calculate workout statistics
  const calculateWorkoutStats = () => {
    if (!workout) return { exerciseCount: 0, setCount: 0, completedSets: 0, estimatedDuration: 0 };
    
    let setCount = 0;
    let completedSets = 0;
    
    workout.exercises.forEach(exercise => {
      setCount += exercise.sets.length;
      completedSets += exercise.sets.filter(set => set.isComplete).length;
    });
    
    // Estimate workout duration based on exercises and sets
    // Average time per set: 45 seconds + 90 seconds rest
    const estimatedSecondsPerSet = 135; // 45s for the set + 90s rest
    const estimatedDuration = Math.round((setCount * estimatedSecondsPerSet) / 60); // in minutes
    
    return {
      exerciseCount: workout.exercises.length,
      setCount,
      completedSets,
      estimatedDuration,
      completionPercentage: setCount > 0 ? Math.round((completedSets / setCount) * 100) : 0
    };
  };
  
  // Render workout statistics
  const renderWorkoutStats = () => {
    const stats = calculateWorkoutStats();
    
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.exerciseCount}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
        
        <Divider style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.setCount}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
        
        <Divider style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={styles.statValueContainer}>
            <Text style={styles.statValue}>{stats.completionPercentage}%</Text>
            {workoutStarted && (
              <Badge style={styles.statBadge} size={8} />
            )}
          </View>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        
        <Divider style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <View style={styles.statValueWithIcon}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.statValue}>{stats.estimatedDuration}</Text>
          </View>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
      </View>
    );
  };
  
  // Render an exercise item
  const renderExerciseItem = ({ item, drag, isActive }: RenderItemParams<WorkoutExercise>) => {
    // Check if all sets are completed for this exercise
    const totalSets = item.sets.length;
    const completedSets = item.sets.filter(set => set.isComplete).length;
    const allSetsCompleted = totalSets > 0 && completedSets === totalSets;
    const index = workout?.exercises.findIndex(exercise => exercise.id === item.id) ?? 0;
    
    // Check if this exercise is part of a superset
    const isSuperset = item.supersetId !== undefined && item.supersetId !== null;
    
    // Find superset partner if applicable
    const supersetPartners = workout?.exercises.filter(
      ex => ex.supersetId === item.supersetId && ex.id !== item.id
    ) || [];
    
    return (
      <Animated.View 
        style={[
          styles.exerciseItem,
          isActive && styles.exerciseItemActive,
          isSuperset && styles.supersetExerciseItem
        ]}
      >
        {isSuperset && (
          <View style={styles.supersetBadge}>
            <Star size={12} color="#F59E0B" />
            <Text style={styles.supersetBadgeText}>
              Superset
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={styles.dragHandle}
        >
          <GripVertical size={16} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.exerciseContent}
          onPress={() => handleExerciseClick(index)}
        >
          {/* Exercise Image Placeholder */}
          <View style={styles.exerciseImageContainer}>
            {allSetsCompleted && (
              <View style={styles.completedOverlay}>
                <Check size={24} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.exerciseImage}>
              {/* Placeholder for exercise image */}
              <Text style={styles.exerciseImageText}>
                {item.name.substring(0, 1).toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.exerciseDetails}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <Text style={styles.exerciseInfo}>
              {item.primaryMuscles} • {item.equipment}
            </Text>
            
            {workoutStarted ? (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {completedSets}/{totalSets} sets
                </Text>
              </View>
            ) : (
              <Text style={styles.setsText}>
                {item.sets.length} {item.sets.length === 1 ? 'set' : 'sets'}
              </Text>
            )}
          </View>
          
          <View style={styles.exerciseActions}>
            <TouchableOpacity 
              style={styles.exerciseMenuButton}
              onPress={() => exerciseMenuOpen === item.id ? 
                setExerciseMenuOpen(null) : setExerciseMenuOpen(item.id)}
            >
              <MoreHorizontal size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        
        {/* Exercise Menu */}
        {exerciseMenuOpen === item.id && (
          <View style={styles.exerciseMenu}>
            <TouchableOpacity 
              style={styles.exerciseMenuItem}
              onPress={() => {
                setExerciseMenuOpen(null);
                // Edit exercise logic
              }}
            >
              <Edit size={16} color="#111827" />
              <Text style={styles.exerciseMenuItemText}>Edit</Text>
            </TouchableOpacity>
            
            {!isSuperset && supersetPartners.length === 0 && (
              <TouchableOpacity 
                style={styles.exerciseMenuItem}
                onPress={() => {
                  setExerciseMenuOpen(null);
                  // Superset logic
                }}
              >
                <Star size={16} color="#111827" />
                <Text style={styles.exerciseMenuItemText}>Make Superset</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.exerciseMenuItem, styles.exerciseMenuItemDanger]}
              onPress={() => {
                setExerciseMenuOpen(null);
                removeExercise(item.id);
              }}
            >
              <Trash2 size={16} color="#EF4444" />
              <Text style={styles.exerciseMenuItemTextDanger}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  };
  
  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading workout...</Text>
      </View>
    );
  }
  
  // Calculate workout stats for rendering
  const stats = calculateWorkoutStats();
  
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
              style={styles.headerIconButton}
              onPress={() => setShowTemplateModal(true)}
            >
              <Calendar size={22} color="#111827" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerSaveButton}
              onPress={() => setSaveAsTemplateModalVisible(true)}
            >
              <Text style={styles.headerSaveText}>Save as template</Text>
              <Bookmark size={18} color="#FCFDFD" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim }
          ]}
        >
          {/* Workout Title */}
          <View style={styles.workoutTitleContainer}>
            {editingName ? (
              <View style={styles.workoutNameEditContainer}>
                <TextInput
                  style={styles.workoutNameInput}
                  value={workoutName}
                  onChangeText={setWorkoutName}
                  autoFocus
                  onBlur={updateWorkoutName}
                  onSubmitEditing={updateWorkoutName}
                />
                <TouchableOpacity onPress={updateWorkoutName}>
                  <Save size={22} color="#4F46E5" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.workoutTitleRow}>
                <Text style={styles.workoutTitle}>{workoutName}</Text>
                <TouchableOpacity onPress={() => setEditingName(true)}>
                  <Edit size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}
            
            <Text style={styles.workoutDate}>
              {workout?.startedAt ? 
                new Date(workout.startedAt).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                }) : 
                new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })
              }
            </Text>
          </View>
          
          {/* Workout Stats */}
          {renderWorkoutStats()}
          
          {/* Exercise List */}
          <View style={styles.exercisesContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Exercises</Text>
              {workout?.exercises.length > 0 && (
                <TouchableOpacity 
                  style={styles.sectionAction}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Exercises' })}
                >
                  <Text style={styles.sectionActionText}>View Library</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {workout?.exercises.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No exercises added yet. Add exercises to start your workout.
                </Text>
              </View>
            ) : (
              <DraggableFlatList
                data={workout?.exercises || []}
                renderItem={renderExerciseItem}
                keyExtractor={(item) => item.id}
                onDragEnd={({ data }) => reorderExercises(data)}
                containerStyle={styles.exerciseList}
              />
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        {!workoutStarted && workout?.exercises.length > 0 && (
          <TouchableOpacity 
            style={styles.startButton}
            onPress={startWorkout}
          >
            <Text style={styles.startButtonText}>Start workout</Text>
            <Play size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.addButton, workoutStarted && styles.fullWidthButton]}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Exercises' })}
        >
          <Plus size={22} color="#374151" />
          <Text style={styles.addButtonText}>Add exercise</Text>
        </TouchableOpacity>
      </View>
      
      {/* Save as Template Modal */}
      <Portal>
        <Modal
          visible={saveAsTemplateModalVisible}
          onDismiss={() => setSaveAsTemplateModalVisible(false)}
          contentContainerStyle={styles.templateModal}
        >
          <Text style={styles.templateModalTitle}>Save as Template</Text>
          
          <TextInput
            style={styles.templateInput}
            placeholder="Template Name"
            value={templateName}
            onChangeText={setTemplateName}
          />
          
          <TextInput
            style={[styles.templateInput, styles.templateDescriptionInput]}
            placeholder="Description (optional)"
            value={templateDescription}
            onChangeText={setTemplateDescription}
            multiline
            numberOfLines={3}
          />
          
          <TextInput
            style={styles.templateInput}
            placeholder="Category (e.g., Push, Pull, Upper, Lower)"
            value={templateCategory}
            onChangeText={setTemplateCategory}
          />
          
          <View style={styles.templateModalButtons}>
            <Button
              mode="outlined"
              onPress={() => setSaveAsTemplateModalVisible(false)}
              style={styles.templateCancelButton}
            >
              Cancel
            </Button>
            
            <Button
              mode="contained"
              onPress={saveAsTemplate}
              style={styles.templateSaveButton}
              disabled={!templateName.trim()}
            >
              Save Template
            </Button>
          </View>
        </Modal>
      </Portal>
      
      {/* Templates Modal */}
      <Portal>
        <Modal
          visible={showTemplateModal}
          onDismiss={() => setShowTemplateModal(false)}
          contentContainerStyle={styles.templatesListModal}
        >
          <View style={styles.templatesListHeader}>
            <Text style={styles.templatesListTitle}>Workout Templates</Text>
            <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
              <Text style={styles.templatesListClose}>Close</Text>
            </TouchableOpacity>
          </View>
          
          {workoutTemplates.length === 0 ? (
            <View style={styles.templatesEmptyState}>
              <Text style={styles.templatesEmptyText}>
                No templates saved yet. Create a workout and save it as a template.
              </Text>
            </View>
          ) : (
            <FlatList
              data={workoutTemplates}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.templateItem}
                  onPress={() => loadFromTemplate(item.id)}
                >
                  <View style={styles.templateItemContent}>
                    <Text style={styles.templateItemName}>{item.name}</Text>
                    <Text style={styles.templateItemInfo}>
                      {item.exercises.length} exercises
                      {item.category ? ` • ${item.category}` : ''}
                    </Text>
                    
                    {item.description ? (
                      <Text style={styles.templateItemDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  <ChevronRight size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.templatesList}
            />
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    padding: 8,
  },
  headerSaveButton: {
    backgroundColor: '#111827',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  headerSaveText: {
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
  workoutTitleContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 16,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  workoutTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  workoutDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  workoutNameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  workoutNameInput: {
    flex: 1,
    fontSize: 18,
    color: '#111827',
    padding: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  statValueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statBadge: {
    backgroundColor: '#10B981',
  },
  statDivider: {
    height: '60%',
    width: 1,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
  exercisesContainer: {
    marginHorizontal: 16,
  },
  exerciseInfo: {
    marginLeft: 8,
    flex: 1,
  },
  progressContainer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionAction: {
    padding: 4,
  },
  sectionActionText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  emptyState: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  exerciseList: {
    paddingBottom: 16,
  },
  exerciseItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  exerciseItemActive: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  supersetExerciseItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  supersetBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 5,
  },
  supersetBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#92400E',
  },
  dragHandle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  exerciseContent: {
    flexDirection: 'row',
    padding: 12,
    paddingLeft: 32,
  },
  exerciseImageContainer: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(79, 70, 229, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseImageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  exerciseDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  setsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Exercise menu related styles
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseMenuButton: {
    padding: 8,
  },
  exerciseMenu: {
    position: 'absolute',
    right: 12,
    top: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 4,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  exerciseMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  exerciseMenuItemText: {
    fontSize: 14,
    color: '#111827',
  },
  exerciseMenuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  exerciseMenuItemTextDanger: {
    color: '#EF4444',
  },
  
  // Bottom buttons
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  startButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  fullWidthButton: {
    width: '100%',
  },
  
  // Template modal related styles
  templateModal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  templateModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  templateInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  templateDescriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  templateModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  templateCancelButton: {
    borderColor: '#6B7280',
  },
  templateSaveButton: {
    backgroundColor: '#4F46E5',
  },
  
  // Templates list modal styles
  templatesListModal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    paddingTop: 20,
    height: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  templatesListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  templatesListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  templatesListClose: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
  },
  templatesEmptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  templatesEmptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 16,
  },
  templateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  templateItemContent: {
    flex: 1,
    marginRight: 16,
  },
  templateItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  templateItemInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  templateItemDescription: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 4,
  },
  templatesList: {
    padding: 0,
  },
});