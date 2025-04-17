import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView,
  SafeAreaView, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  FlatList,
  Animated,
  Modal,
  ActivityIndicator,
  ImageBackground
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { 
  ArrowLeft, 
  Check, 
  ArrowDownAZ, 
  Search, 
  Clock, 
  Heart, 
  ClipboardList,
  Plus,
  ChevronDown,
  Filter
} from 'lucide-react-native';
import { workoutService } from '../../services/workoutService';
import { MainTabScreenProps } from '../../types/navigation';
import { supabase } from '../../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// Components
import AlphabetSidebar from '../../components/AlphabetSidebar';
import LetterSection from '../../components/LetterSection';
import ExerciseItem from '../../components/ExerciseItem';
import SetPickerSheet from '../../components/SetPickerSheet';
import ScrollPickerSheet from '../../components/ScrollPickerSheet';

// Fonts
import { fonts } from '../../styles/fonts';

// Colors
import { colors } from '../../styles/colors';

// Icons
import Icon from '../../components/Icons';

const { width, height } = Dimensions.get('window');

// Define the exercise type based on the Supabase table structure
type Exercise = {
  id: string;
  name: string;
  primary_muscles: string;
  equipment: string;
  gif_url: string | null;
  description: string | null;
  instructions: string | null;
  muscle_group: string | null;
  body_part: string | null;
  target: string | null;
  // For UI purposes
  added?: boolean;
  selected?: boolean;
};

export default function ExercisesScreen({ navigation }: MainTabScreenProps<'Exercises'>) {
  const [activeFilter, setActiveFilter] = useState('A-Z');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showAlphabetSelector, setShowAlphabetSelector] = useState(true);
  const [showSetSheet, setShowSetSheet] = useState(false);
  const [selectedSets, setSelectedSets] = useState(3); // Default to 3 sets
  const [hasWorkoutExercises, setHasWorkoutExercises] = useState(false);
  const [totalExerciseCount, setTotalExerciseCount] = useState(0);
  const [letterPositions, setLetterPositions] = useState<Record<string, number>>({});

  const alphabet = [
    '#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
  ];

  // Track which letters have exercises
  const [availableLetters, setAvailableLetters] = useState<Record<string, boolean>>({});

  const filters = [
    { id: 'a-z', icon: 'bars-arrow-down', label: 'A-Z' },
    { id: 'search', icon: 'search', label: 'Search' },
    { id: 'recent', icon: 'clock', label: 'Recent' },
    { id: 'favorite', icon: 'heart', label: 'Favorites' }
  ];

  useEffect(() => {
    fetchExercises();
    workoutService.cacheExerciseLibrary();
  }, []);

  useEffect(() => {
    // Apply filters when search query or selected filter changes
    if (exercises.length > 0) {
      applyFilters();
    }
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    checkCurrentWorkoutExercises();
  }, []);
  
  // Use useFocusEffect to check whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkCurrentWorkoutExercises();
      return () => {};
    }, [])
  );

  const checkCurrentWorkoutExercises = async () => {
    try {
      // Read directly from AsyncStorage for the most reliable check
      const currentWorkoutJson = await AsyncStorage.getItem('current_workout');
      
      if (currentWorkoutJson) {
        const workoutData = JSON.parse(currentWorkoutJson);
        const hasExercises = workoutData && 
                             workoutData.exercises && 
                             Array.isArray(workoutData.exercises) && 
                             workoutData.exercises.length > 0;
        
        console.log('Current workout check:', hasExercises ? 'Has exercises' : 'No exercises');
        setHasWorkoutExercises(hasExercises);
      } else {
        console.log('No current workout found');
        setHasWorkoutExercises(false);
      }
    } catch (error) {
      console.error('Error checking current workout:', error);
      setHasWorkoutExercises(false);
    }
  };

  const fetchExercises = async () => {
    try {
      setLoading(true);
      
      // Use the workout service to get exercises with caching support
      const exerciseData = await workoutService.getExerciseLibrary();
      
      if (exerciseData && exerciseData.exercises.length > 0) {
        setTotalExerciseCount(exerciseData.totalCount);
        // Process the data as before
        const processedData = exerciseData.exercises.map((exercise) => ({
          ...exercise,
          selected: false,
          added: false
        }));
        
        setExercises(processedData as Exercise[]);
        setFilteredExercises(processedData as Exercise[]);
        
        // Organize exercises by first letter
        organizeExercisesByLetter(processedData as Exercise[]);
        
        // Track which letters have exercises
        const letters: Record<string, boolean> = {};
        alphabet.forEach(letter => {
          if (letter === '#') {
            // Check if there are exercises starting with numbers
            const hasNumbers = processedData.some(ex => ex.name && /^[0-9]/.test(ex.name));
            letters[letter] = hasNumbers;
          } else {
            const hasLetter = processedData.some(ex => 
              ex.name && ex.name.toUpperCase().startsWith(letter)
            );
            letters[letter] = hasLetter;
          }
        });
        setAvailableLetters(letters);
      } else {
        // If no data available, set empty arrays
        setExercises([]);
        setFilteredExercises([]);
        setAvailableLetters({});
        // Show appropriate message to user
        setError('No exercises available. Please check your connection and try again.');
      }
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setError('Failed to fetch exercises. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...exercises];

    // Apply search filter if in search mode
    if (activeFilter === 'Search' && searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex => 
        ex.name?.toLowerCase().includes(query) ||
        ex.primary_muscles?.toLowerCase().includes(query) ||
        ex.equipment?.toLowerCase().includes(query) ||
        ex.target?.toLowerCase().includes(query) ||
        ex.body_part?.toLowerCase().includes(query)
      );
    }

    // Apply other filters
    if (activeFilter === 'Favorites') {
      // In a real app, this would filter to show only favorited exercises
      // For now, just filter random items
      filtered = filtered.filter((_, index) => index % 5 === 0);
    } else if (activeFilter === 'Recent') {
      // In a real app, this would filter based on recently viewed exercises
      // For now, just take first 10 as example
      filtered = filtered.slice(0, 10);
    }

    setFilteredExercises(filtered);
  };

  // Generate the full Supabase storage URL for an exercise GIF
  const getGifUrl = (fileName: string | null) => {
    if (!fileName) return null;
    return `https://fleiivpyjkvahakriuta.supabase.co/storage/v1/object/public/exercises/gifs/${fileName}`;
  };

  const renderFilterIcon = (iconName: string, color: string) => {
    // Make sure we use a numeric size for icons
    const iconSize = 20;
    
    switch (iconName) {
      case 'bars-arrow-down':
        return <ArrowDownAZ size={iconSize} color={color} />;
      case 'search':
        return <Search size={iconSize} color={color} />;
      case 'clock':
        return <Clock size={iconSize} color={color} />;
      case 'heart':
        return <Heart size={iconSize} color={color} />;
      default:
        return null;
    }
  };

  // Organize exercises by first letter for the A-Z view
  const [exercisesByLetter, setExercisesByLetter] = useState<Record<string, Exercise[]>>({});

  const organizeExercisesByLetter = (exerciseList: Exercise[]) => {
    const grouped: Record<string, Exercise[]> = {};
    
    exerciseList.forEach(exercise => {
      if (exercise.name) {
        let firstLetter;
        // Check if the name starts with a number
        if (/^[0-9]/.test(exercise.name)) {
          firstLetter = '#';
        } else {
          firstLetter = exercise.name[0].toUpperCase();
        }
        
        if (!grouped[firstLetter]) {
          grouped[firstLetter] = [];
        }
        grouped[firstLetter].push(exercise);
      }
    });
    
    // Sort each group alphabetically
    Object.keys(grouped).forEach(letter => {
      grouped[letter].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    setExercisesByLetter(grouped);
  };

  const handleExerciseSelection = (exercise: Exercise) => {
    const updatedExercises = exercises.map(ex => {
      if (ex.id === exercise.id) {
        return { ...ex, selected: !ex.selected };
      }
      return ex;
    });
    
    setExercises(updatedExercises);
    
    // Update filtered exercises too
    const updatedFiltered = filteredExercises.map(ex => {
      if (ex.id === exercise.id) {
        return { ...ex, selected: !ex.selected };
      }
      return ex;
    });
    
    setFilteredExercises(updatedFiltered);
    
    // Update selected exercises list
    const selected = updatedExercises.filter(ex => ex.selected);
    setSelectedExercises(selected);
  };

  // Add or modify the scrollToLetter function
  const scrollToLetter = (letter: string) => {
    if (letterPositions[letter] !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ 
        y: letterPositions[letter] - 20, // 20px offset for better visibility
        animated: true 
      });
    }
  };

  // Function to handle layout measurements
  const handleLetterLayout = (letter: string, y: number) => {
    setLetterPositions(prev => ({
      ...prev,
      [letter]: y
    }));
  };

  const handleAddExercises = () => {
    // Open the set selection sheet
    setShowSetSheet(true);
  };
  
  const confirmAddExercises = async (setCount: number) => {
    // Close the sheet
    setShowSetSheet(false);
    
    // Mark the selected exercises as added
    const updatedExercises = exercises.map(ex => {
      if (selectedExercises.some(selected => selected.id === ex.id)) {
        return { ...ex, selected: false, added: true };
      }
      return ex;
    });
    
    setExercises(updatedExercises);
    
    // Update filtered exercises too
    const updatedFiltered = filteredExercises.map(ex => {
      if (selectedExercises.some(selected => selected.id === ex.id)) {
        return { ...ex, selected: false, added: true };
      }
      return ex;
    });
    
    setFilteredExercises(updatedFiltered);
    
    // Save selected exercises to AsyncStorage for the WorkoutOverviewScreen screen
    try {
      // First, try to get any existing workout data
      const existingWorkoutJson = await AsyncStorage.getItem('current_workout');
      let workoutData = existingWorkoutJson ? JSON.parse(existingWorkoutJson) : { 
        name: 'New Workout',
        notes: '',
        exercises: []
      };
      
// When adding exercises to the workout, generate unique IDs
const selectedExercisesForWorkout = selectedExercises.map(ex => ({
  // Use Date.now() + random number to ensure uniqueness
  id: `${ex.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  exerciseId: ex.id,
  name: ex.name,
  primaryMuscles: ex.primary_muscles || 'Unknown',
  equipment: ex.equipment || 'Bodyweight',
  sets: Array.from({ length: selectedSets }, (_, i) => ({
    id: `set-${Date.now()}-${i + 1}-${Math.random().toString(36).substr(2, 5)}`,
    setNumber: i + 1,
    weight: null,
    reps: null,
    isComplete: false
  })),
  notes: '',
  isExpanded: true
}));
      
      // Add to existing exercises or create new array
      workoutData.exercises = [
        ...(workoutData.exercises || []),
        ...selectedExercisesForWorkout
      ];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('current_workout', JSON.stringify(workoutData));
      setHasWorkoutExercises(true);

    } catch (error) {
      console.error('Error saving workout data:', error);
      // Consider showing an alert to the user
    }
    
    // Clear selected exercises
    setSelectedExercises([]);
    
    console.log(`Added ${selectedExercises.length} exercises with ${selectedSets} sets each`);
  };

  const handleBuildSuperSet = () => {
    // Handle building super set - for now just log
    console.log(`Building super set with ${selectedExercises.length} exercises`);
    // In a real app, navigate to superset creation screen
  };

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={36} color="#007AFF" />
          <Text>Loading exercises...</Text>
        </View>
      );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchExercises}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
  <View style={styles.headerLeft}>
    <TouchableOpacity 
      onPress={() => navigation.goBack()} 
      style={styles.backButton}
    >
      <ArrowLeft size={24} color="#000" />
    </TouchableOpacity>
    
    {hasWorkoutExercises && (
      <TouchableOpacity 
        style={styles.viewWorkoutButton}
        onPress={() => navigation.navigate('WorkoutOverviewScreen')}
      >
        <Text style={styles.viewWorkoutText}>View workout</Text>
        <ChevronDown size={18} color="#000" />
      </TouchableOpacity>
    )}
  </View>
  
  <View style={styles.headerRight}>
    {hasWorkoutExercises && (
      <TouchableOpacity 
        style={styles.doneButton}
        onPress={() => navigation.navigate('WorkoutOverviewScreen')}
      >
        <Text style={styles.doneButtonText}>Done</Text>
        <Check size={18} color="#fff" />
      </TouchableOpacity>
    )}
  </View>
</View>
      
      {/* Title and Description */}
      <View style={styles.titleContainer}>
  <Text style={styles.title}>Library</Text>
  <Text style={styles.subtitle}>Add from {totalExerciseCount} exercises to your workout</Text>
</View>
      
      {/* Filters */}
      <View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterBadge,
              activeFilter === filter.label ? styles.activeFilterBadge : styles.inactiveFilterBadge
            ]}
            onPress={() => setActiveFilter(filter.label)}
          >
            {renderFilterIcon(
              filter.icon, 
              activeFilter === filter.label ? '#FCFDFD' : '#4B555F'
            )}
            <Text 
              style={[
                styles.filterLabel,
                activeFilter === filter.label ? styles.activeFilterLabel : styles.inactiveFilterLabel
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
{activeFilter === 'A-Z' ? (
  // A-Z view - organize by first letter
  Object.entries(exercisesByLetter).sort().map(([letter, letterExercises]) => (
    <LetterSection
      key={letter}
      letter={letter}
      exercises={letterExercises}
      onLayout={handleLetterLayout}
      onExerciseSelection={handleExerciseSelection}
      getGifUrl={getGifUrl}
    />
  ))
) : (
            // Other filter views - simple list
            filteredExercises.map(exercise => (
              <ExerciseItem
                key={exercise.id}
                exercise={exercise}
                onPress={() => handleExerciseSelection(exercise)}
                getGifUrl={getGifUrl}
              />
            ))
          )}
          
          {/* Extra padding at the bottom for floating button */}
          <View style={styles.bottomPadding} />
        </ScrollView>
        
        {/* Alphabet selector (right side) */}
        {activeFilter === 'A-Z' && showAlphabetSelector && (
  <AlphabetSidebar 
    alphabet={alphabet}
    availableLetters={availableLetters}
    onLetterPress={scrollToLetter}
  />
)}
      </View>
      
      {/* Floating action buttons */}
      {selectedExercises.length > 0 && (
        <View style={styles.floatingButtonsContainer}>
          <TouchableOpacity 
            style={styles.addExercisesButton}
            onPress={handleAddExercises}
          >
            <Text style={styles.addExercisesButtonText}>
              Add {selectedExercises.length > 1 ? `${selectedExercises.length} exercises` : 'exercise'}
            </Text>
          </TouchableOpacity>
          
          {selectedExercises.length >= 2 && (
            <TouchableOpacity 
              style={styles.buildSuperSetButton}
              onPress={handleBuildSuperSet}
            >
              <Text style={styles.buildSuperSetButtonText}>Build Super Set</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* Filter/Count button */}
      <TouchableOpacity 
        style={[
          styles.filterCountButton,
          selectedExercises.length > 0 && styles.filterCountButtonWithCount
        ]}
      >
        {selectedExercises.length > 0 ? (
          <Text style={styles.filterCountText}>{selectedExercises.length}</Text>
        ) : (
          <Filter size={20} color="#fff" />
        )}
      </TouchableOpacity>
      
{/* Sets Selection Sheet Modal */}
<ScrollPickerSheet
  visible={showSetSheet}
  onClose={() => setShowSetSheet(false)}
  initialValue={selectedSets}
  onSave={confirmAddExercises}
  exerciseCount={selectedExercises.length}
  maxSets={50}
/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F7',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  viewWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewWorkoutText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    marginRight: 4,
  },
  iconButton: {
    marginRight: 12,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[900],
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.medium,
    marginRight: 4,
  },
  titleContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 36,
    color: colors.gray[900],
    marginBottom: 0,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 0,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    paddingVertical: 8,
    //marginBottom: 0,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 8,
    height: 40,
  },
  activeFilterBadge: {
    backgroundColor: colors.gray[900],
  },
  inactiveFilterBadge: {
    backgroundColor: '#F9FAFC',
  },
  filterLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    marginLeft: 4,
  },
  activeFilterLabel: {
    color: '#FCFDFD',
  },
  inactiveFilterLabel: {
    color: '#4B555F',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F7',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F7',
    padding: 20,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.gray[900],
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#9CA3AF',
  },
  floatingButtonsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'column',
  },
  addExercisesButton: {
    backgroundColor: colors.gray[900],
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addExercisesButtonText: {
    fontFamily: fonts.medium,
    color: '#FFFFFF',
    fontSize: 16,
  },
  buildSuperSetButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buildSuperSetButtonText: {
    fontFamily: fonts.medium,
    color: colors.gray[900],
    fontSize: 16,
  },
  filterCountButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[900],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  filterCountButtonWithCount: {
    backgroundColor: '#4F46E5',
  },
  filterCountText: {
    fontFamily: fonts.medium,
    color: '#FFFFFF',
    fontSize: 18,
  },
  bottomPadding: {
    height: 120,
  },
  setSheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  setSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  setSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  setSheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.gray[900],
  },
  setSheetCancel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#4F46E5',
  },
  pickerContainer: {
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  picker: {
    height: 150,
    width: '100%',
  },
  confirmButton: {
    backgroundColor: colors.gray[900],
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontFamily: fonts.medium,
    color: '#FFFFFF',
    fontSize: 16,
  },
  containerModal: {
    flex: 1,
    backgroundColor: '#fcfefe',
    paddingHorizontal: 16,
    paddingBottom: 36,
    marginTop: 'auto', // This makes it stick to the bottom
  },
  bottomIndicator: {
    width: '100%',
    height: 21,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: 48,
    height: 5,
    borderRadius: 100,
    backgroundColor: '#d1d5db',
  },
  contentModal: {
    flex: 1,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titleModal: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#111827',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setList: {
    flex: 1,
    maxHeight: 350, // Limit height
  },
  setOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  selectedSetOption: {
    borderBottomColor: '#e5e7eb',
  },
  setOptionText: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#d1d5db',
  },
  selectedSetOptionText: {
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 5,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fcfefe',
    fontSize: 16,
    fontFamily: fonts.medium,
  },
});