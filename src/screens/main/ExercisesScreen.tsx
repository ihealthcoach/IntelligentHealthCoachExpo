import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
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
import { MainTabScreenProps } from '../../types/navigation';
import { supabase } from '../../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Mock exercises for development
const mockExercises: Exercise[] = [
  {
    id: '1',
    name: 'Barbell Bench Press',
    primary_muscles: 'Chest',
    equipment: 'Barbell',
    gif_url: null,
    description: 'A compound exercise that targets the chest, shoulders, and triceps.',
    instructions: 'Lie on a bench, grip the barbell with hands slightly wider than shoulder-width, lower the bar to chest level, and push back up.',
    muscle_group: 'Push',
    body_part: 'Upper Body',
    target: 'Pectorals',
  },
  {
    id: '2',
    name: 'Barbell Squat',
    primary_muscles: 'Quadriceps',
    equipment: 'Barbell',
    gif_url: null,
    description: 'A compound leg exercise that targets the quadriceps, hamstrings, and glutes.',
    instructions: 'Position barbell on shoulders, feet shoulder-width apart, bend knees and hips to lower your body, then return to standing.',
    muscle_group: 'Legs',
    body_part: 'Lower Body',
    target: 'Quadriceps',
  },
  {
    id: '3',
    name: 'Cable Row',
    primary_muscles: 'Back',
    equipment: 'Cable',
    gif_url: null,
    description: 'An exercise that targets the middle back muscles.',
    instructions: 'Sit at a cable row station, grab the handle, pull it towards your abdomen while keeping your back straight.',
    muscle_group: 'Pull',
    body_part: 'Upper Body',
    target: 'Latissimus Dorsi',
  },
  {
    id: '4',
    name: 'Dumbbell Curl',
    primary_muscles: 'Biceps',
    equipment: 'Dumbbells',
    gif_url: null,
    description: 'An isolation exercise for the biceps.',
    instructions: 'Hold a dumbbell in each hand, arms extended, curl the weights up by bending at the elbow, then lower back down.',
    muscle_group: 'Pull',
    body_part: 'Upper Body',
    target: 'Biceps',
  },
  {
    id: '5',
    name: 'Deadlift',
    primary_muscles: 'Lower Back',
    equipment: 'Barbell',
    gif_url: null,
    description: 'A compound exercise that targets multiple muscle groups.',
    instructions: 'Stand with feet hip-width apart, bend at hips and knees to grasp barbell, then lift by extending hips and knees.',
    muscle_group: 'Pull',
    body_part: 'Full Body',
    target: 'Erector Spinae',
  },
  {
    id: '6',
    name: 'Lateral Raise',
    primary_muscles: 'Shoulders',
    equipment: 'Dumbbells',
    gif_url: null,
    description: 'An isolation exercise that targets the lateral deltoids.',
    instructions: 'Hold dumbbells at sides, raise arms laterally until parallel with floor, then lower back down.',
    muscle_group: 'Push',
    body_part: 'Upper Body',
    target: 'Deltoids',
  },
  {
    id: '7',
    name: 'Pull-Up',
    primary_muscles: 'Back',
    equipment: 'Body Weight',
    gif_url: null,
    description: 'A compound bodyweight exercise that targets the back muscles.',
    instructions: 'Hang from a bar with hands wider than shoulder-width, pull your body up until chin is above the bar, then lower back down.',
    muscle_group: 'Pull',
    body_part: 'Upper Body',
    target: 'Latissimus Dorsi',
  },
  {
    id: '8',
    name: 'Push-Up',
    primary_muscles: 'Chest',
    equipment: 'Body Weight',
    gif_url: null,
    description: 'A compound bodyweight exercise that targets the chest, shoulders, and triceps.',
    instructions: 'Start in plank position with hands shoulder-width apart, lower body until chest nearly touches floor, then push back up.',
    muscle_group: 'Push',
    body_part: 'Upper Body',
    target: 'Pectorals',
  },
  {
    id: '9',
    name: 'Romanian Deadlift',
    primary_muscles: 'Hamstrings',
    equipment: 'Barbell',
    gif_url: null,
    description: 'A variation of the deadlift that targets the hamstrings and lower back.',
    instructions: 'Stand with feet hip-width apart, hold barbell in front of thighs, hinge at hips while keeping back straight, then return to standing.',
    muscle_group: 'Pull',
    body_part: 'Lower Body',
    target: 'Hamstrings',
  },
  {
    id: '10',
    name: 'Tricep Pushdown',
    primary_muscles: 'Triceps',
    equipment: 'Cable',
    gif_url: null,
    description: 'An isolation exercise for the triceps.',
    instructions: 'Stand facing a cable machine with high pulley, grasp the bar, push down until arms are fully extended, then return to starting position.',
    muscle_group: 'Push',
    body_part: 'Upper Body',
    target: 'Triceps',
  },
  {
    id: '11',
    name: 'Leg Press',
    primary_muscles: 'Quadriceps',
    equipment: 'Machine',
    gif_url: null,
    description: 'A compound exercise that targets the quadriceps, hamstrings, and glutes.',
    instructions: 'Sit in the leg press machine, feet shoulder-width apart on platform, extend legs, then bend knees to return to starting position.',
    muscle_group: 'Legs',
    body_part: 'Lower Body',
    target: 'Quadriceps',
  },
  {
    id: '12',
    name: 'Dumbbell Shoulder Press',
    primary_muscles: 'Shoulders',
    equipment: 'Dumbbells',
    gif_url: null,
    description: 'A compound exercise that targets the shoulders and triceps.',
    instructions: 'Sit or stand holding dumbbells at shoulder height, press weights overhead until arms are extended, then lower back to starting position.',
    muscle_group: 'Push',
    body_part: 'Upper Body',
    target: 'Deltoids',
  },
  {
    id: '13',
    name: 'Face Pull',
    primary_muscles: 'Rear Deltoids',
    equipment: 'Cable',
    gif_url: null,
    description: 'An exercise that targets the rear deltoids and upper back.',
    instructions: 'Stand facing a cable machine with rope attachment at face height, pull rope toward face with elbows high, then return to starting position.',
    muscle_group: 'Pull',
    body_part: 'Upper Body',
    target: 'Rear Deltoids',
  },
  {
    id: '14',
    name: 'Lunges',
    primary_muscles: 'Quadriceps',
    equipment: 'Body Weight',
    gif_url: null,
    description: 'A unilateral exercise that targets the quadriceps, hamstrings, and glutes.',
    instructions: 'Stand with feet together, step forward with one leg into a lunge position, then push back to starting position.',
    muscle_group: 'Legs',
    body_part: 'Lower Body',
    target: 'Quadriceps',
  },
  {
    id: '15',
    name: 'Ab Crunch',
    primary_muscles: 'Abdominals',
    equipment: 'Body Weight',
    gif_url: null,
    description: 'An isolation exercise for the abdominal muscles.',
    instructions: 'Lie on back with knees bent, hands behind head, lift shoulders off floor by contracting abs, then lower back down.',
    muscle_group: 'Core',
    body_part: 'Core',
    target: 'Rectus Abdominis',
  },
  {
    id: '16',
    name: 'Leg Extension',
    primary_muscles: 'Quadriceps',
    equipment: 'Machine',
    gif_url: null,
    description: 'An isolation exercise for the quadriceps.',
    instructions: 'Sit in leg extension machine, place ankles under pad, extend legs until straight, then return to starting position.',
    muscle_group: 'Legs',
    body_part: 'Lower Body',
    target: 'Quadriceps',
  },
  {
    id: '17',
    name: 'Incline Bench Press',
    primary_muscles: 'Upper Chest',
    equipment: 'Barbell',
    gif_url: null,
    description: 'A variation of the bench press that targets the upper chest.',
    instructions: 'Lie on an incline bench, grip barbell with hands slightly wider than shoulder-width, lower to chest, then push back up.',
    muscle_group: 'Push',
    body_part: 'Upper Body',
    target: 'Upper Pectorals',
  },
  {
    id: '18',
    name: 'Lat Pulldown',
    primary_muscles: 'Back',
    equipment: 'Cable',
    gif_url: null,
    description: 'A compound exercise that targets the latissimus dorsi and biceps.',
    instructions: 'Sit at lat pulldown machine, grasp bar with wide grip, pull down to upper chest, then slowly return to starting position.',
    muscle_group: 'Pull',
    body_part: 'Upper Body',
    target: 'Latissimus Dorsi',
  },
  {
    id: '19',
    name: 'Plank',
    primary_muscles: 'Core',
    equipment: 'Body Weight',
    gif_url: null,
    description: 'An isometric exercise that targets the core, shoulders, and back.',
    instructions: 'Start in push-up position with forearms on floor, maintain straight line from head to heels, hold position.',
    muscle_group: 'Core',
    body_part: 'Core',
    target: 'Transverse Abdominis',
  },
  {
    id: '20',
    name: 'Kettlebell Swing',
    primary_muscles: 'Hamstrings',
    equipment: 'Kettlebell',
    gif_url: null,
    description: 'A dynamic exercise that targets the posterior chain.',
    instructions: 'Stand with feet shoulder-width apart, hold kettlebell with both hands, swing between legs and up to chest height using hip hinge.',
    muscle_group: 'Pull',
    body_part: 'Full Body',
    target: 'Hamstrings',
  },
];

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
    loadMockExercises();
    // correct code below
    // fetchExercises();
  }, []);

  useEffect(() => {
    // Apply filters when search query or selected filter changes
    if (exercises.length > 0) {
      applyFilters();
    }
  }, [searchQuery, activeFilter]);

  // Mock data start
  const loadMockExercises = () => {
    try {
      setLoading(true);
      
      // Set our mock exercises with UI properties
      const processedData = mockExercises.map((exercise) => ({
        ...exercise,
        selected: false,
        added: false
      }));
      
      setExercises(processedData);
      setFilteredExercises(processedData);
      
      // Organize exercises by first letter
      organizeExercisesByLetter(processedData);
      
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
      
      // Simulate a short loading time for better UX
      setTimeout(() => {
        setLoading(false);
      }, 500);
      
    } catch (err) {
      console.error('Error loading mock exercises:', err);
      setError('Failed to load exercises. Please try again.');
      setLoading(false);
    }
  };
  // Mock data end

   // Original Supabase fetch function (commented out)
  const fetchExercises = async () => {
    /* try {
      setLoading(true);
      let query = supabase.from('exercises').select('*');
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Mark some exercises as added for UI purposes (later this will be from real data)
        const processedData = data.map((exercise) => ({
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
      }
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setError('Failed to fetch exercises. Please try again later.');
    } finally {
      setLoading(false);
    } */
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

  const scrollToLetter = (letter: string) => {
    // Find the section with this letter
    if (exercisesByLetter[letter] && exercisesByLetter[letter].length > 0) {
      // Get all letter keys and find the index of the current letter
      const letters = Object.keys(exercisesByLetter).sort();
      const letterIndex = letters.indexOf(letter);
      
      if (letterIndex !== -1 && scrollViewRef.current) {
        // Use the reference to scroll to an approximated position
        // This is a simplified approach - for more precise scrolling, 
        // you would need to measure section heights
        scrollViewRef.current.scrollTo({ 
          y: letterIndex * 200, // Approximate height per letter section
          animated: true 
        });
      }
    }
  };

  const handleAddExercises = () => {
    // Open the set selection sheet
    setShowSetSheet(true);
  };
  
  const confirmAddExercises = async () => {
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
    
    // Save selected exercises to AsyncStorage for the WorkoutExerciseOverview screen
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

  const renderLetterSidebar = () => {
    return (
      <View style={styles.alphabetContainer}>
        {alphabet.map((letter) => (
          <TouchableOpacity
            key={letter}
            onPress={() => scrollToLetter(letter)}
            disabled={!availableLetters[letter]}
          >
            <Text
              style={[
                styles.alphabetLetter,
                !availableLetters[letter] && styles.alphabetLetterInactive
              ]}
            >
              {letter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
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
          
          <TouchableOpacity 
          style={styles.viewWorkoutButton}
          onPress={() => navigation.navigate('WorkoutExerciseOverview')}
        >
          <Text style={styles.viewWorkoutText}>View workout</Text>
          <ChevronDown size={18} color="#000" />
        </TouchableOpacity>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
          style={styles.doneButton}
          onPress={() => navigation.navigate('WorkoutExerciseOverview')}
        >
          <Text style={styles.doneButtonText}>Done</Text>
          <Check size={18} color="#fff" />
        </TouchableOpacity>
        </View>
      </View>
      
      {/* Title and Description */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Library</Text>
        <Text style={styles.subtitle}>Add exercises to your workout</Text>
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
              <View key={letter} style={styles.letterSection}>
                <Text style={styles.letterHeader}>{letter}</Text>
                {letterExercises.map(exercise => (
                  <TouchableOpacity 
                    key={exercise.id} 
                    style={styles.exerciseItem}
                    onPress={() => handleExerciseSelection(exercise)}
                  >
                    <View style={styles.exerciseImageContainer}>
                      {exercise.selected && (
                        <View style={styles.checkBadge}>
                          <Check size={12} color="#FCFDFD" />
                        </View>
                      )}
                      <View style={styles.imageWrapper}>
                        <Image 
                          source={exercise.gif_url 
                            ? { uri: getGifUrl(exercise.gif_url) } 
                            : { uri: 'https://via.placeholder.com/68x68/333' }}
                          style={styles.exerciseImage} 
                          resizeMode="cover"
                        />
                        <View 
                          style={[
                            styles.blendOverlay, 
                            // @ts-ignore - Adding mixBlendMode which isn't in RN's TypeScript definitions
                            { mixBlendMode: 'multiply' }
                          ]} 
                        />
                      </View>
                    </View>
                    
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <View style={styles.exerciseDetails}>
                        <Text style={styles.exerciseDetail}>{exercise.primary_muscles || 'Unknown'}, </Text>
                        <Text style={styles.exerciseDetail}>{exercise.equipment || 'Bodyweight'}</Text>
                      </View>
                    </View>
                    
                    {exercise.added && (
                      <View style={styles.addedContainer}>
                        <Text style={styles.addedText}>Added</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))
          ) : (
            // Other filter views - simple list
            filteredExercises.map(exercise => (
              <TouchableOpacity 
                key={exercise.id} 
                style={styles.exerciseItem}
                onPress={() => handleExerciseSelection(exercise)}
              >
              <View style={styles.exerciseImageContainer}>
                {exercise.selected && (
                  <View style={styles.checkBadge}>
                    <Check size={12} color="#FCFDFD" />
                  </View>
                )}
                <View style={styles.imageWrapper}>
                  <Image 
                    source={exercise.gif_url 
                      ? { uri: getGifUrl(exercise.gif_url) } 
                      : { uri: 'https://via.placeholder.com/68x68/333' }}
                    style={styles.exerciseImage} 
                    resizeMode="cover"
                  />
                  <View style={styles.blendOverlay} />
                </View>
              </View>
                
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <View style={styles.exerciseDetails}>
                    <Text style={styles.exerciseDetail}>{exercise.primary_muscles || 'Unknown'}, </Text>
                    <Text style={styles.exerciseDetail}>{exercise.equipment || 'Bodyweight'}</Text>
                  </View>
                </View>
                
                {exercise.added && (
                  <View style={styles.addedContainer}>
                    <Text style={styles.addedText}>Added</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}

          {(activeFilter !== 'A-Z' && filteredExercises.length === 0) && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No exercises found</Text>
            </View>
          )}
          
          {/* Extra padding at the bottom for floating button */}
          <View style={styles.bottomPadding} />
        </ScrollView>
        
        {/* Alphabet selector (right side) */}
        {activeFilter === 'A-Z' && showAlphabetSelector && renderLetterSidebar()}
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
      <Modal
        visible={showSetSheet}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.setSheetContainer}>
          <View style={styles.setSheetContent}>
            <View style={styles.setSheetHeader}>
              <Text style={styles.setSheetTitle}>
                How many sets?
              </Text>
              <TouchableOpacity onPress={() => setShowSetSheet(false)}>
                <Text style={styles.setSheetCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedSets}
                onValueChange={(itemValue) => setSelectedSets(itemValue)}
                style={styles.picker}
              >
                {Array.from({ length: 50 }, (_, i) => i + 1).map(value => (
                  <Picker.Item 
                    key={value} 
                    label={`${value} set${value > 1 ? 's' : ''}`} 
                    value={value} 
                  />
                ))}
              </Picker>
            </View>
            
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={confirmAddExercises}
            >
              <Text style={styles.confirmButtonText}>
                Confirm {selectedSets} set{selectedSets > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 10,
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
    fontSize: 16,
    fontWeight: '500',
    marginRight: 4,
  },
  iconButton: {
    marginRight: 12,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginRight: 4,
  },
  titleContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 0,
  },
  subtitle: {
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
    backgroundColor: '#111827',
  },
  inactiveFilterBadge: {
    backgroundColor: '#F9FAFC',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
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
  letterSection: {
    marginBottom: 6,
  },
  letterHeader: {
    fontSize: 36,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
    marginBottom: 6,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    height: 68,
  },
  exerciseImageContainer: {
    width: 68,
    height: 68,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  }, 
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  // Type assertion to bypass TypeScript checking
  blendOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240,240,240,0.4)',
  } as any,
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 0,
  },
  exerciseDetails: {
    flexDirection: 'row',
    marginTop: 0,
  },
  exerciseDetail: {
    fontSize: 11,
    color: '#9CA3AF',
    marginRight: 2,
  },
  addedContainer: {
    width: 36,
    alignItems: 'flex-end',
  },
  addedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  alphabetContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingRight: 2,
    zIndex: 10,
  },
  alphabetLetter: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    paddingVertical: 1,
  },
  alphabetLetterInactive: {
    color: '#D1D5DB',
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
    backgroundColor: '#111827',
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
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
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addExercisesButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
    color: '#111827',
    fontWeight: '600',
    fontSize: 16,
  },
  filterCountButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  filterCountButtonWithCount: {
    backgroundColor: '#4F46E5',
  },
  filterCountText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
  },
  setSheetCancel: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
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
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  }
});