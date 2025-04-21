import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView, 
  StatusBar,
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
import { TextInput } from 'react-native-paper';

// Components
import AlphabetSidebar from '../../components/workout/AlphabetSidebar';
import LetterSection from '../../components/workout/LetterSection';
import ExerciseItem from '../../components/workout/ExerciseItem';
import FlexibleSheet from '../../components/FlexibleSheet';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

// Components
import Icon from '../../components/Icons';
import { IconName } from '../../components/Icons';

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
  // Basic display state
  const [activeFilter, setActiveFilter] = useState('a-z');
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

  // Filter UI options - for display only
  const filters = [
    { id: 'a-z', icon: 'bars-arrow-down', label: 'A-Z' },
    { id: 'search', icon: 'search', label: 'Search' },
    { id: 'recent', icon: 'clock', label: 'Recent' },
    { id: 'favorite', icon: 'heart', label: 'Favorites' },
    { id: 'filters', icon: 'filter', label: 'Filters' }
  ];

// Component lifecycle logging and one-time setup
useEffect(() => {
  console.log("ExercisesScreen rendered");
  fetchExercises();
  workoutService.cacheExerciseLibrary();
  return () => console.log("ExercisesScreen unmounted");
}, []);

// Refresh data when screen comes into focus
useFocusEffect(
  React.useCallback(() => {
    checkCurrentWorkoutExercises();
    return () => {};
  }, [])
);

  // Simple UI-only filter change handler (functionality removed)
  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
  };

  useEffect(() => {
    fetchExercises();
    workoutService.cacheExerciseLibrary();
  }, []);

  useEffect(() => {
    checkCurrentWorkoutExercises();
  }, []);

  useEffect(() => {
    if (filteredExercises.length > 0) {
      organizeExercisesByLetter(filteredExercises);
    }
  }, [filteredExercises]);

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

  // Generate the full Supabase storage URL for an exercise GIF
  const getGifUrl = (fileName: string | null) => {
    if (!fileName) return null;
    return `https://fleiivpyjkvahakriuta.supabase.co/storage/v1/object/public/exercises/gifs/${fileName}`;
  };

  const renderFilterIcon = (iconName: string, color: string) => {
    // Make sure we use a numeric size for icons
    const iconSize = 20;
    
    try {
      switch (iconName) {
        case 'bars-arrow-down':
          return <ArrowDownAZ size={iconSize} color={color} />;
        case 'search':
          return <Search size={iconSize} color={color} />;
        case 'clock':
          return <Clock size={iconSize} color={color} />;
        case 'heart':
          return <Heart size={iconSize} color={color} />;
        case 'filter':
          return <Filter size={iconSize} color={color} />;
        default:
          console.warn(`Unknown icon name: ${iconName}`);
          return null;
      }
    } catch (error) {
      console.error(`Error rendering icon ${iconName}:`, error);
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

  // Handle exercise selection but don't filter
  const handleExerciseSelection = (exercise: Exercise) => {
    // Immediately update the selectedExercises array first
    setSelectedExercises(prevSelected => {
      const isAlreadySelected = prevSelected.some(ex => ex.id === exercise.id);
      
      if (isAlreadySelected) {
        // Remove from selection if already selected
        return prevSelected.filter(ex => ex.id !== exercise.id);
      } else {
        // Add to selection if not already selected
        return [...prevSelected, exercise];
      }
    });
    
    // Then update the UI state for highlighting the selected exercise
    setExercises(prevExercises => 
      prevExercises.map(ex => 
        ex.id === exercise.id ? { ...ex, selected: !ex.selected } : ex
      )
    );
    
    setFilteredExercises(prevFiltered => 
      prevFiltered.map(ex => 
        ex.id === exercise.id ? { ...ex, selected: !ex.selected } : ex
      )
    );
  };

  // Function to handle scrolling to a letter section
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

  // Handle adding exercises to workout
  const handleAddExercises = () => {
    setSelectedSets(3);
    // Open the set selection sheet
    setShowSetSheet(true);
  };
  
  // Confirm adding exercises with selected sets
  const confirmAddExercises = async (setsCount = selectedSets) => {
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
        sets: Array.from({ length: setsCount }, (_, i) => ({
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

    // Reset selected sets to default value (3)
    setSelectedSets(3);
  };

  // Handle superset button
  const handleBuildSuperSet = () => {
    // In a real app, this would build a superset
    console.log(`Building super set with ${selectedExercises.length} exercises`);
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
    <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />

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
    activeFilter === filter.id ? styles.activeFilterBadge : styles.inactiveFilterBadge
  ]}
  onPress={() => handleFilterChange(filter.id)}
>
  {renderFilterIcon(
    filter.icon, 
    activeFilter === filter.id ? '#FCFDFD' : '#4B555F'
  )}
  <Text 
    style={[
      styles.filterLabel,
      activeFilter === filter.id ? styles.activeFilterLabel : styles.inactiveFilterLabel
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
{activeFilter === 'a-z' ? (
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
  // Simple fallback rendering for other filter views
<View>
  {filteredExercises.map(exercise => {
    // Make sure exercise is a valid object with at least an id
    if (!exercise || !exercise.id) return null;
    
    return (
      <ExerciseItem
        key={exercise.id}
        exercise={exercise}
        onPress={() => handleExerciseSelection(exercise)}
        getGifUrl={getGifUrl}
      />
    );
  })}
</View>
)}
          
          {/* Extra padding at the bottom for floating button */}
          <View style={styles.bottomPadding} />
        </ScrollView>
        
        {/* Alphabet selector (right side) */}
        {activeFilter === 'a-z' && showAlphabetSelector && (
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
      <FlexibleSheet
  visible={showSetSheet}
  onClose={() => setShowSetSheet(false)}
  title="How many sets?"
  initialHeight="40%"
>
  <View style={styles.pickerContainer}>
    <Picker
      selectedValue={selectedSets}
      onValueChange={(itemValue) => setSelectedSets(itemValue)}
      style={styles.picker}
    >
      {Array.from({ length: 20 }, (_, i) => i + 1).map(value => (
        <Picker.Item 
          key={value} 
          label={`${value} ${value === 1 ? 'set' : 'sets'}`} 
          value={value} 
        />
      ))}
    </Picker>
  </View>
  
  <TouchableOpacity 
    style={styles.confirmButton} 
    onPress={() => confirmAddExercises(selectedSets)}
  >
    <Text style={styles.confirmButtonText}>
      Confirm {selectedSets} {selectedSets === 1 ? 'set' : 'sets'}
    </Text>
  </TouchableOpacity>
</FlexibleSheet>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    backgroundColor: colors.gray[50],
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
    backgroundColor: colors.gray[100],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
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
    backgroundColor: colors.common.white,
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
    backgroundColor: colors.indigo[600],
  },
  filterCountText: {
    fontFamily: fonts.medium,
    color: '#FFFFFF',
    fontSize: 18,
  },
  bottomPadding: {
    height: 120,
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
    backgroundColor: colors.indigo[600],
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    fontFamily: fonts.medium,
    color: '#FFFFFF',
    fontSize: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.common.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingLeft: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.gray[900],
  },
  errorItem: {
    padding: 16,
    backgroundColor: '#FFDDDD',
    borderRadius: 8,
    marginVertical: 4,
  },
  simpleExerciseItem: {
    padding: 16,
    backgroundColor: colors.common.white,
    borderRadius: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  simpleExerciseName: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.gray[900],
  },
  simpleExerciseDetails: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});