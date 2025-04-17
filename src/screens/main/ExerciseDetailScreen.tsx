import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
  ImageStyle
} from 'react-native';
import {
  ArrowLeft,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Award,
  TrendingUp,
  Calendar,
  Check,
  Info,
  Play,
  ChevronRight,
  Flag
} from 'lucide-react-native';
import { Button, ProgressBar, Chip, Portal, Modal } from 'react-native-paper';
import { MainStackScreenProps } from '../../types/navigation';
import { workoutService } from '../../services/workoutService';
import { Workout, ExerciseProgressData } from '../../types/workout';
import { useAuth } from '../../contexts/AuthContext';
import { Video } from 'expo-av';

// Fonts
import { fonts } from '../../styles/fonts';

// Colors
import { colors } from '../../styles/colors';

// Get screen dimensions
const { width } = Dimensions.get('window');

// Props type for the screen
type ExerciseDetailScreenProps = MainStackScreenProps<'ExerciseDetail'>;

export default function ExerciseDetailScreen({ route, navigation }: ExerciseDetailScreenProps) {
  const { user } = useAuth();
  const { exerciseId } = route.params;
  
  // State
  const [loading, setLoading] = useState(true);
  const [exerciseDetails, setExerciseDetails] = useState<any>(null);
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseProgressData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'month' | 'year' | 'all'>('month');
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Load exercise details and history
  const loadExerciseData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Mock data - in a real app this would come from an API or database
      const mockExerciseDetails = {
        id: exerciseId,
        name: 'Barbell Bench Press',
        primaryMuscles: 'Chest',
        secondaryMuscles: ['Triceps', 'Shoulders'],
        equipment: 'Barbell',
        category: 'Strength',
        difficulty: 'Intermediate',
        instructions: [
          'Lie on a flat bench with your feet flat on the floor.',
          'Grip the barbell with hands slightly wider than shoulder-width apart.',
          'Lift the barbell off the rack and hold it straight over your chest with arms locked.',
          'Lower the bar slowly until it touches your chest.',
          'Push the bar back to the starting position, focusing on using your chest muscles.',
          'Repeat for the desired number of repetitions.'
        ],
        videoUrl: 'https://example.com/bench-press.mp4',
        tips: [
          'Keep your feet flat on the ground throughout the movement.',
          'Maintain a slight arch in your lower back.',
          'Keep your elbows at approximately a 45-degree angle from your body.',
          'Breathe out as you push the bar up.'
        ],
        personalRecord: {
          weight: 225,
          reps: 5,
          date: '2023-08-15'
        }
      };
      
      setExerciseDetails(mockExerciseDetails);
      
      // Get exercise history from workouts
      await loadExerciseHistory();
    } catch (error) {
      console.error('Error loading exercise data:', error);
    } finally {
      setLoading(false);
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [exerciseId]);
  
  // Load exercise history from workouts
  const loadExerciseHistory = async () => {
    try {
      // Get workout history
      const workoutHistory = await workoutService.getWorkoutHistory();
      
      // Extract exercise data from workouts
      const exerciseData: ExerciseProgressData = {
        exerciseId,
        name: 'Barbell Bench Press', // Would be populated from the exercise details
        data: []
      };
      
      // Process each workout to find this exercise
      workoutHistory.forEach(workout => {
        workout.exercises.forEach(exercise => {
          if (exercise.exerciseId === exerciseId) {
            // Find the heaviest set with the most reps (for 1RM calculation)
            let maxWeight = 0;
            let maxReps = 0;
            let maxVolume = 0;
            let estimatedOneRepMax = 0;
            
            exercise.sets.forEach(set => {
              if (set.isComplete && set.weight && set.reps) {
                const volume = set.weight * set.reps;
                maxVolume += volume;
                
                // Update max weight/reps
                if (set.weight > maxWeight) {
                  maxWeight = set.weight;
                  maxReps = set.reps;
                }
                
                // Calculate 1RM for this set
                const oneRepMax = workoutService.calculateOneRepMax(set.weight, set.reps);
                if (oneRepMax > estimatedOneRepMax) {
                  estimatedOneRepMax = oneRepMax;
                }
              }
            });
            
            // Add to history data if we have valid data
            if (maxWeight > 0 && maxReps > 0) {
              exerciseData.data.push({
                date: workout.completedAt || workout.startedAt || new Date().toISOString(),
                maxWeight,
                maxReps,
                volume: maxVolume,
                estimatedOneRepMax
              });
            }
          }
        });
      });
      
      // Sort by date
      exerciseData.data.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setExerciseHistory(exerciseData);
    } catch (error) {
      console.error('Error loading exercise history:', error);
    }
  };
  
  // Load data on initial render
  useEffect(() => {
    loadExerciseData();
  }, [loadExerciseData]);
  
  // Filter exercise history by time range
  const getFilteredHistory = () => {
    if (!exerciseHistory) return [];
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (selectedTimeRange) {
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        cutoffDate = new Date(0); // Beginning of time
        break;
    }
    
    return exerciseHistory.data.filter(item => 
      new Date(item.date) >= cutoffDate
    );
  };
  
  // Get progress stats
  const getProgressStats = () => {
    const filteredHistory = getFilteredHistory();
    
    if (filteredHistory.length < 2) {
      return {
        weightChange: 0,
        volumeChange: 0,
        oneRepMaxChange: 0
      };
    }
    
    const first = filteredHistory[0];
    const last = filteredHistory[filteredHistory.length - 1];
    
    const weightChange = last.maxWeight - first.maxWeight;
    const volumeChange = last.volume - first.volume;
    const oneRepMaxChange = last.estimatedOneRepMax - first.estimatedOneRepMax;
    
    return {
      weightChange,
      volumeChange,
      oneRepMaxChange
    };
  };
  
  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading exercise details...</Text>
      </View>
    );
  }
  
  // Get filtered history and progress stats
  const filteredHistory = getFilteredHistory();
  const progressStats = getProgressStats();
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Exercise Details</Text>
        
        <TouchableOpacity>
          <Info size={24} color={colors.gray[900]} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Exercise Title and Info */}
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseTitle}>{exerciseDetails.name}</Text>
            <View style={styles.exerciseTags}>
              <Chip style={styles.exerciseTag} textStyle={styles.exerciseTagText}>
                {exerciseDetails.primaryMuscles}
              </Chip>
              <Chip style={styles.exerciseTag} textStyle={styles.exerciseTagText}>
                {exerciseDetails.equipment}
              </Chip>
              <Chip style={styles.exerciseTag} textStyle={styles.exerciseTagText}>
                {exerciseDetails.difficulty}
              </Chip>
            </View>
          </View>
          
          {/* Exercise Image/Video Placeholder */}
          <View style={styles.exerciseMedia}>
            <Image 
                source={{ uri: 'https://via.placeholder.com/600x400?text=Exercise+Demonstration' }} 
                style={styles.exerciseImage as ImageStyle}
                resizeMode="cover"
                />
            <TouchableOpacity 
              style={styles.playButton}
              onPress={() => setShowInstructionsModal(true)}
            >
              <Play size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Personal Record Card */}
          {exerciseDetails.personalRecord && (
            <View style={styles.prCard}>
              <View style={styles.prHeader}>
                <View style={styles.prTitleContainer}>
                  <Award size={20} color="#F59E0B" />
                  <Text style={styles.prTitle}>Personal Record</Text>
                </View>
                <Text style={styles.prDate}>
                  {new Date(exerciseDetails.personalRecord.date).toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.prDetails}>
                <View style={styles.prStat}>
                  <Text style={styles.prStatValue}>
                    {exerciseDetails.personalRecord.weight}kg
                  </Text>
                  <Text style={styles.prStatLabel}>Weight</Text>
                </View>
                
                <View style={styles.prStat}>
                  <Text style={styles.prStatValue}>
                    {exerciseDetails.personalRecord.reps}
                  </Text>
                  <Text style={styles.prStatLabel}>Reps</Text>
                </View>
                
                <View style={styles.prStat}>
                  <Text style={styles.prStatValue}>
                    {Math.round(workoutService.calculateOneRepMax(
                      exerciseDetails.personalRecord.weight, 
                      exerciseDetails.personalRecord.reps
                    ))}kg
                  </Text>
                  <Text style={styles.prStatLabel}>Est. 1RM</Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Exercise Progress */}
          {filteredHistory.length > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Progress</Text>
                
                <View style={styles.timeRangeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.timeRangeButton,
                      selectedTimeRange === 'month' && styles.timeRangeButtonActive
                    ]}
                    onPress={() => setSelectedTimeRange('month')}
                  >
                    <Text
                      style={[
                        styles.timeRangeText,
                        selectedTimeRange === 'month' && styles.timeRangeTextActive
                      ]}
                    >
                      Month
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.timeRangeButton,
                      selectedTimeRange === 'year' && styles.timeRangeButtonActive
                    ]}
                    onPress={() => setSelectedTimeRange('year')}
                  >
                    <Text
                      style={[
                        styles.timeRangeText,
                        selectedTimeRange === 'year' && styles.timeRangeTextActive
                      ]}
                    >
                      Year
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.timeRangeButton,
                      selectedTimeRange === 'all' && styles.timeRangeButtonActive
                    ]}
                    onPress={() => setSelectedTimeRange('all')}
                  >
                    <Text
                      style={[
                        styles.timeRangeText,
                        selectedTimeRange === 'all' && styles.timeRangeTextActive
                      ]}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Progress Stats */}
              <View style={styles.progressStats}>
                <View style={styles.progressStat}>
                  <View style={[
                    styles.progressStatIcon,
                    progressStats.weightChange >= 0 ? styles.progressPositive : styles.progressNegative
                  ]}>
                    {progressStats.weightChange >= 0 ? (
                      <TrendingUp size={16} color="#059669" />
                    ) : (
                      <TrendingUp size={16} color="#DC2626" style={{ transform: [{ rotate: '180deg' }] }} />
                    )}
                  </View>
                  <Text style={styles.progressStatValue}>
                    {progressStats.weightChange > 0 ? '+' : ''}
                    {progressStats.weightChange}kg
                  </Text>
                  <Text style={styles.progressStatLabel}>Weight</Text>
                </View>
                
                <View style={styles.progressStat}>
                  <View style={[
                    styles.progressStatIcon,
                    progressStats.volumeChange >= 0 ? styles.progressPositive : styles.progressNegative
                  ]}>
                    {progressStats.volumeChange >= 0 ? (
                      <TrendingUp size={16} color="#059669" />
                    ) : (
                      <TrendingUp size={16} color="#DC2626" style={{ transform: [{ rotate: '180deg' }] }} />
                    )}
                  </View>
                  <Text style={styles.progressStatValue}>
                    {progressStats.volumeChange > 0 ? '+' : ''}
                    {progressStats.volumeChange}kg
                  </Text>
                  <Text style={styles.progressStatLabel}>Volume</Text>
                </View>
                
                <View style={styles.progressStat}>
                  <View style={[
                    styles.progressStatIcon,
                    progressStats.oneRepMaxChange >= 0 ? styles.progressPositive : styles.progressNegative
                  ]}>
                    {progressStats.oneRepMaxChange >= 0 ? (
                      <TrendingUp size={16} color="#059669" />
                    ) : (
                      <TrendingUp size={16} color="#DC2626" style={{ transform: [{ rotate: '180deg' }] }} />
                    )}
                  </View>
                  <Text style={styles.progressStatValue}>
                    {progressStats.oneRepMaxChange > 0 ? '+' : ''}
                    {Math.round(progressStats.oneRepMaxChange)}kg
                  </Text>
                  <Text style={styles.progressStatLabel}>Est. 1RM</Text>
                </View>
              </View>
              
              {/* Chart Placeholder */}
              <View style={styles.chartContainer}>
                <View style={styles.chartPlaceholder}>
                  <BarChart2 size={32} color="#9CA3AF" />
                  <Text style={styles.chartPlaceholderText}>
                    {filteredHistory.length} data points
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Exercise Instructions */}
          <View style={styles.instructionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              <TouchableOpacity onPress={() => setShowInstructionsModal(true)}>
                <Text style={styles.sectionAction}>View Video</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.instructionsList}>
              {exerciseDetails.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>
                    {instruction}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Exercise Tips */}
          <View style={styles.tipsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tips</Text>
            </View>
            
            <View style={styles.tipsList}>
              {exerciseDetails.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Check size={16} color="#4F46E5" />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Exercise History */}
          <View style={styles.historySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>History</Text>
              <TouchableOpacity>
                <Text style={styles.sectionAction}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {filteredHistory.length > 0 ? (
              <View style={styles.historyList}>
                {filteredHistory.slice(-5).reverse().map((record, index) => (
                  <View key={index} style={styles.historyItem}>
                    <View style={styles.historyDateContainer}>
                      <Calendar size={14} color="#6B7280" />
                      <Text style={styles.historyDate}>
                        {new Date(record.date).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <View style={styles.historyDetails}>
                      <View style={styles.historyDetail}>
                        <Text style={styles.historyDetailLabel}>Weight</Text>
                        <Text style={styles.historyDetailValue}>{record.maxWeight}kg</Text>
                      </View>
                      
                      <View style={styles.historyDetail}>
                        <Text style={styles.historyDetailLabel}>Reps</Text>
                        <Text style={styles.historyDetailValue}>{record.maxReps}</Text>
                      </View>
                      
                      <View style={styles.historyDetail}>
                        <Text style={styles.historyDetailLabel}>Volume</Text>
                        <Text style={styles.historyDetailValue}>{record.volume}kg</Text>
                      </View>
                      
                      <View style={styles.historyDetail}>
                        <Text style={styles.historyDetailLabel}>Est. 1RM</Text>
                        <Text style={styles.historyDetailValue}>{Math.round(record.estimatedOneRepMax)}kg</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyHistoryText}>
                  No history found for this exercise in the selected time period.
                </Text>
              </View>
            )}
          </View>
          
          {/* Set a Goal Button */}
          <View style={styles.goalButtonContainer}>
            <TouchableOpacity style={styles.goalButton}>
              <Flag size={20} color="#FFFFFF" />
              <Text style={styles.goalButtonText}>Set a Goal for This Exercise</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Video Instructions Modal */}
      <Portal>
        <Modal
          visible={showInstructionsModal}
          onDismiss={() => setShowInstructionsModal(false)}
          contentContainerStyle={styles.videoModal}
        >
          <View style={styles.videoModalHeader}>
            <Text style={styles.videoModalTitle}>Exercise Demonstration</Text>
            <TouchableOpacity onPress={() => setShowInstructionsModal(false)}>
              <Text style={styles.videoModalClose}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.videoContainer}>
            {/* In a real app, this would be a video player */}
            <Image 
              source={{ uri: 'https://via.placeholder.com/600x400?text=Video+Demonstration' }} 
              style={styles.videoPlayer}
              resizeMode="cover"
            />
            <View style={styles.videoPlayButton}>
              <Play size={32} color="#FFFFFF" />
            </View>
          </View>
          
          <ScrollView style={styles.videoInstructions}>
            <Text style={styles.videoInstructionsTitle}>
              How to Perform {exerciseDetails.name}
            </Text>
            
            {exerciseDetails.instructions.map((instruction, index) => (
              <View key={index} style={styles.videoInstructionItem}>
                <View style={styles.videoInstructionNumber}>
                  <Text style={styles.videoInstructionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.videoInstructionText}>
                  {instruction}
                </Text>
              </View>
            ))}
          </ScrollView>
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
  loadingText: {
    fontFamily: fonts.regular,
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.gray[900],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  exerciseHeader: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  exerciseTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.gray[900],
    marginBottom: 12,
  },
  exerciseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exerciseTag: {
    backgroundColor: '#EEF2FF',
  },
  exerciseTagText: {
    color: '#4F46E5',
    fontSize: 12,
  },
  exerciseMedia: {
    position: 'relative',
    height: 200,
    backgroundColor: '#E5E7EB',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -24 },
      { translateY: -24 }
    ],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  prHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  prTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#92400E',
  },
  prDate: {
    fontSize: 12,
    color: '#92400E',
  },
  prDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prStat: {
    alignItems: 'center',
  },
  prStatValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#92400E',
    marginBottom: 4,
  },
  prStatLabel: {
    fontSize: 12,
    color: '#92400E',
  },
  progressSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.gray[900],
  },
  sectionAction: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#4F46E5',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeRangeButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  timeRangeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  timeRangeTextActive: {
    fontFamily: fonts.medium,
    color: colors.gray[900],
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressPositive: {
    backgroundColor: '#ECFDF5',
  },
  progressNegative: {
    backgroundColor: '#FEF2F2',
  },
  progressStatValue: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.gray[900],
    marginBottom: 2,
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  chartContainer: {
    height: 200,
  },
  chartPlaceholder: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  instructionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#4F46E5',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  tipsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  historySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  historyList: {
    gap: 16,
  },
  historyItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  historyDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyDetail: {
    alignItems: 'center',
  },
  historyDetailLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  historyDetailValue: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.gray[900],
  },
  emptyHistory: {
    padding: 24,
    alignItems: 'center',
  },
  emptyHistoryText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
  },
  goalButtonContainer: {
    padding: 16,
  },
  goalButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  goalButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  videoModal: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    height: '80%',
    overflow: 'hidden',
  },
  videoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  videoModalTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.gray[900],
  },
  videoModalClose: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#4F46E5',
  },
  videoContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#E5E7EB',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -24 },
      { translateY: -24 }
    ],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInstructions: {
    flex: 1,
    padding: 16,
  },
  videoInstructionsTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.gray[900],
    marginBottom: 16,
  },
  videoInstructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  videoInstructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInstructionNumberText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#4F46E5',
  },
  videoInstructionText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});