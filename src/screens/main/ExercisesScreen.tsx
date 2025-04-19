import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Filter } from 'lucide-react-native';
import { workoutService } from '../../services/workoutService';
import { MainTabScreenProps } from '../../types/navigation';
import { supabase } from '../../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { TextInput } from 'react-native-paper';

// Components
import AlphabetSidebar from '../../components/AlphabetSidebar';
import LetterSection from '../../components/LetterSection';
import ExerciseItem from '../../components/ExerciseItem';
import FlexibleSheet from '../../components/FlexibleSheet';
import FilterOptions, { FilterType } from '../../components/workout/FilterOptions';

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

  // Debounce utility function
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

export default function ExercisesScreen({ navigation }: MainTabScreenProps<'Exercises'>) {
  // UI state only
  const [activeFilter, setActiveFilter] = useState<FilterType>('a-z');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showAlphabetSelector, setShowAlphabetSelector] = useState(true);
  const [showSetSheet, setShowSetSheet] = useState(false);
  const [selectedSets, setSelectedSets] = useState(3); // Default to 3 sets
  const [hasWorkoutExercises, setHasWorkoutExercises] = useState(false);
  const [totalExerciseCount, setTotalExerciseCount] = useState(0);
  const [letterPositions, setLetterPositions] = useState<Record<string, number>>({});
  const isMounted = useRef(true);

  const alphabet = [
    '#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
  ];

  // Track which letters have exercises (UI only)
  const [availableLetters, setAvailableLetters] = useState<Record<string, boolean>>({});

  useEffect(() => {
    console.log("ExercisesScreen rendered");
    return () => console.log("ExercisesScreen unmounted");
  }, []);

  // Simplified UI-only filter handler - doesn't actually filter content
  const handleFilterChange = (filterId: FilterType) => {
    console.log(`Filter changed from ${activeFilter} to ${filterId}`);
    setActiveFilter(filterId);
    
    // For search filter, show search input
    if (filterId === 'search') {
      setSearchVisible(true);
    } else {
      setSearchVisible(false);
    }
  };

  useEffect(() => {
    fetchExercises();
    workoutService.cacheExerciseLibrary();
  }, []);

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

  useEffect(() => {
    // Only organize exercises by letter for UI display
    if (activeFilter === 'a-z' && filteredExercises.length > 0) {
      // Use the debounced version instead
      debouncedOrganizeExercises(filteredExercises);
    }
  }, [activeFilter, filteredExercises.length, debouncedOrganizeExercises]);

  // useEffect cleanup
  useEffect(() => {
    fetchExercises();
    workoutService.cacheExerciseLibrary();
    
    return () => {
      // Set mounted flag to false when unmounting
      isMounted.current = false;
    };
  }, []);

  // Inside your component, add this:
const debouncedOrganizeExercises = useCallback(
  debounce((exerciseList) => {
    console.log("Running debounced organize function");
    if (!isMounted.current) return;
    
    const grouped = {};
    
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
  }, 300), // 300ms debounce time
  [/* dependencies if needed */]
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

  const fetchExercises = async () => {
    try {
      setLoading(true);
      
      // Use the workout service to get exercises with caching support
      const exerciseData = await workoutService.getExerciseLibrary();

      // Check if component is still mounted before updating state
      if (!isMounted.current) return;
      
      if (exerciseData && exerciseData.exercises.length > 0) {
        setTotalExerciseCount(exerciseData.totalCount);
        
        const processedData = exerciseData.exercises.map((exercise) => ({
          ...exercise,
          selected: false,
          added: false
        }));
        
        setExercises(processedData as Exercise[]);
        setFilteredExercises(processedData as Exercise[]);
        
        // Organize exercises by first letter (for UI display only)
        debouncedOrganizeExercises(processedData as Exercise[]);
        
        // Track which letters have exercises (for UI display)
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
      if (isMounted.current) {
      setLoading(false);
      }
    }
  };

  // Generate the full Supabase storage URL for an exercise GIF
  const getGifUrl = (fileName: string | null) => {
    if (!fileName) return null;
    return `https://fleiivpyjkvahakriuta.supabase.co/storage/v1/object/public/exercises/gifs/${fileName}`;
  };

  // No filter icon render function needed since it's moved to the FilterOptions component

  // Organize exercises by first letter for the A-Z view (UI only)
  const [exercisesByLetter, setExercisesByLetter] = useState<Record<string, Exercise[]>>({});

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

  // Scroll to letter UI function (remains functional)
  const scrollToLetter = (letter: string) => {
    const y = letterPositions[letter];
    if (typeof y === 'number' && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ 
        y: y - 20,
        animated: true 
      });
    } else {
      console.warn(`No position recorded for letter: ${letter}`);
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
    setSelectedSets(3);
    // Open the set selection sheet
    setShowSetSheet(true);
  };
  
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
    
    console.log(`Added ${selectedExercises.length} exercises with ${setsCount} sets each`);
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
              <Icon name="arrow-left-solid" size={24} color={colors.gray[900]} />
            </TouchableOpacity>
            
            {hasWorkoutExercises && (
              <TouchableOpacity 
                style={styles.viewWorkoutButton}
                onPress={() => navigation.navigate('WorkoutOverviewScreen')}
              >
                <Text style={styles.viewWorkoutText}>View workout</Text>
                <Icon name="chevron-down-mini" size={18} color={colors.gray[900]} />
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
                <Icon name="check-mini" size={18} color={colors.common.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Title and Description */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Library</Text>
          <Text style={styles.subtitle}>Add from {totalExerciseCount} exercises to your workout</Text>
        </View>
        
        {/* Filters - UI only, using separate component */}
        <FilterOptions 
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />

        {activeFilter === 'search' && (
          <View style={styles.searchInputContainer}>
            <Icon name="magnifying-glass-outline" size={20} color={colors.gray[600]} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search exercises..."
              placeholderTextColor="#9CA3AF"
            />
          </View>
        )}

        {/* Main Content */}
        <View style={styles.contentContainer}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {activeFilter === 'a-z' && Object.keys(exercisesByLetter).length > 0 ? (
              // A-Z view - organize by first letter
              Object.entries(exercisesByLetter)
                .sort()
                .map(([letter, letterExercises]) => (
                  <LetterSection
                    key={letter}
                    letter={letter}
                    exercises={letterExercises || []}
                    onLayout={handleLetterLayout}
                    onExerciseSelection={handleExerciseSelection}
                    getGifUrl={getGifUrl}
                  />
                ))
            ) : (
              // Simple list view for other filters
              <>
                {filteredExercises.map(exercise => (
                  exercise && exercise.id ? (
                    <ExerciseItem
                      key={exercise.id}
                      exercise={exercise}
                      onPress={() => handleExerciseSelection(exercise)}
                      getGifUrl={getGifUrl}
                    />
                  ) : null
                ))}
              </>
            )}
            
            {/* Extra padding at the bottom for floating button */}
            <View style={styles.bottomPadding} />
          </ScrollView>
          
          {/* Alphabet selector (right side) */}
          {activeFilter === 'a-z' && (
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
  // Removed filter-related styles as they're moved to the FilterOptions component
  contentContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.gray[300],
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
});