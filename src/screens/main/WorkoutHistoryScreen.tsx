import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import {
  Calendar,
  ChevronRight,
  Clock,
  BarChart as BarChartIcon,
  TrendingUp,
  Dumbbell,
  ArrowUpRight,
  Calendar as CalendarIcon,
  Filter
} from 'lucide-react-native';
import { Chip, Portal, Modal, Button, Divider } from 'react-native-paper';
import { workoutService } from '../../services/workoutService';
import { useAuth } from '../../contexts/AuthContext';
import { Workout, WorkoutExercise, MuscleGroupVolume } from '../../types/workout';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { MainTabScreenProps } from '../../types/navigation';

// Fonts
import { fonts } from '../../styles/fonts';

// Colors
import { colors } from '../../styles/colors';

// Duration formatting helper
const formatDuration = (seconds: number | undefined): string => {
  if (!seconds) return '0m';
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${minutes}m`;
};

// Date formatting helper
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

export default function WorkoutHistoryScreen({ navigation }: MainTabScreenProps<'History'>) {
  const { user } = useAuth();
  
  // State
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  
  // Calculated data for charts
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [muscleGroupData, setMuscleGroupData] = useState<MuscleGroupVolume[]>([]);
  const [workoutFrequencyData, setWorkoutFrequencyData] = useState<any[]>([]);
  const screenWidth = Dimensions.get('window').width;
  
  // Load workout history
  const loadWorkoutHistory = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get workout history from service
      const history = await workoutService.getWorkoutHistory();
      setWorkouts(history);
      
      // Calculate data for charts
      calculateChartData(history);
    } catch (error) {
      console.error('Error loading workout history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  
  // Calculate data for charts
  const calculateChartData = (workouts: Workout[]) => {
    if (!workouts.length) return;
    
    // Filter workouts by selected time range
    const filtered = filterWorkoutsByTimeRange(workouts, selectedTimeRange);
    
    // Calculate volume data (total volume by date)
    calculateVolumeData(filtered);
    
    // Calculate muscle group distribution
    calculateMuscleGroupDistribution(filtered);
    
    // Calculate workout frequency
    calculateWorkoutFrequency(filtered);
  };
  
  // Filter workouts by time range
  const filterWorkoutsByTimeRange = (workouts: Workout[], range: 'week' | 'month' | 'year'): Workout[] => {
    const now = new Date();
    let cutoffDate: Date;
    
    switch (range) {
      case 'week':
        cutoffDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
    }
    
    return workouts.filter(workout => {
      const workoutDate = new Date(workout.completedAt || workout.startedAt || '');
      return workoutDate >= cutoffDate;
    });
  };
  
  // Calculate volume data for chart
  const calculateVolumeData = (workouts: Workout[]) => {
    // Group workouts by date and calculate total volume
    const volumeByDate: { [date: string]: number } = {};
    
    workouts.forEach(workout => {
      const date = new Date(workout.completedAt || workout.startedAt || '');
      const dateString = date.toISOString().split('T')[0];
      
      // Calculate total volume for this workout
      let workoutVolume = 0;
      
      workout.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (set.isComplete && set.weight && set.reps) {
            workoutVolume += set.weight * set.reps;
          }
        });
      });
      
      // Add to volume by date
      if (volumeByDate[dateString]) {
        volumeByDate[dateString] += workoutVolume;
      } else {
        volumeByDate[dateString] = workoutVolume;
      }
    });
    
    // Convert to chart data format
    const chartData = Object.entries(volumeByDate).map(([date, volume]) => ({
      date,
      volume: Math.round(volume)
    }));
    
    // Sort by date
    chartData.sort((a, b) => a.date.localeCompare(b.date));
    
    setVolumeData(chartData);
  };
  
  // Calculate muscle group distribution
  const calculateMuscleGroupDistribution = (workouts: Workout[]) => {
    // Count volume by muscle group
    const volumeByMuscle: { [muscle: string]: number } = {};
    let totalVolume = 0;
    
    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const muscleGroup = exercise.primaryMuscles;
        let exerciseVolume = 0;
        
        exercise.sets.forEach(set => {
          if (set.isComplete && set.weight && set.reps) {
            exerciseVolume += set.weight * set.reps;
          }
        });
        
        if (muscleGroup) {
          if (volumeByMuscle[muscleGroup]) {
            volumeByMuscle[muscleGroup] += exerciseVolume;
          } else {
            volumeByMuscle[muscleGroup] = exerciseVolume;
          }
          
          totalVolume += exerciseVolume;
        }
      });
    });
    
    // Convert to chart data format
    const chartData: MuscleGroupVolume[] = Object.entries(volumeByMuscle).map(([muscleGroup, volume]) => ({
      muscleGroup,
      volume: Math.round(volume),
      percentage: totalVolume > 0 ? Math.round((volume / totalVolume) * 100) : 0
    }));
    
    // Sort by volume descending
    chartData.sort((a, b) => b.volume - a.volume);
    
    setMuscleGroupData(chartData);
  };
  
  // Calculate workout frequency
  const calculateWorkoutFrequency = (workouts: Workout[]) => {
    // Count workouts by day of week
    const workoutsByDay: { [day: number]: number } = {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
    };
    
    workouts.forEach(workout => {
      const date = new Date(workout.completedAt || workout.startedAt || '');
      const dayOfWeek = date.getDay();
      workoutsByDay[dayOfWeek]++;
    });
    
    // Convert to chart data format
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = Object.entries(workoutsByDay).map(([day, count]) => ({
      day: dayNames[parseInt(day)],
      count
    }));
    
    setWorkoutFrequencyData(chartData);
  };
  
  // Load data on initial render
  useEffect(() => {
    loadWorkoutHistory();
  }, [loadWorkoutHistory]);
  
  // Update charts when time range changes
  useEffect(() => {
    if (workouts.length > 0) {
      calculateChartData(workouts);
    }
  }, [selectedTimeRange, workouts]);
  
  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWorkoutHistory();
  }, [loadWorkoutHistory]);
  
  // Change time range
  const handleTimeRangeChange = (range: 'week' | 'month' | 'year') => {
    setSelectedTimeRange(range);
  };
  
  // Handle filter by muscle group
  const handleFilterByMuscle = (muscleGroup: string | null) => {
    setSelectedMuscleGroup(muscleGroup);
    setShowFilterModal(false);
  };
  
  // Get filtered workouts
  const getFilteredWorkouts = () => {
    if (!selectedMuscleGroup) return workouts;
    
    return workouts.filter(workout => 
      workout.exercises.some(exercise => 
        exercise.primaryMuscles === selectedMuscleGroup
      )
    );
  };
  
  // Calculate statistics
  const calculateStats = () => {
    if (!workouts.length) return { totalWorkouts: 0, totalVolume: 0, avgDuration: 0 };
    
    // Filter workouts by time range
    const filteredWorkouts = filterWorkoutsByTimeRange(workouts, selectedTimeRange);
    
    // Calculate total volume
    let totalVolume = 0;
    let totalDuration = 0;
    
    filteredWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (set.isComplete && set.weight && set.reps) {
            totalVolume += set.weight * set.reps;
          }
        });
      });
      
      if (workout.duration) {
        totalDuration += workout.duration;
      }
    });
    
    const avgDuration = filteredWorkouts.length ? Math.round(totalDuration / filteredWorkouts.length) : 0;
    
    return {
      totalWorkouts: filteredWorkouts.length,
      totalVolume: Math.round(totalVolume),
      avgDuration
    };
  };
  
  const stats = calculateStats();
  
  // Render loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading workout history...</Text>
      </View>
    );
  }
  
  const filteredWorkouts = getFilteredWorkouts();
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout History</Text>
        
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
          <Filter size={20} color="colors.gray[100]" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filteredWorkouts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            {/* Time Range Selector */}
            <View style={styles.timeRangeContainer}>
              <TouchableOpacity
                style={[
                  styles.timeRangeButton,
                  selectedTimeRange === 'week' && styles.timeRangeButtonActive
                ]}
                onPress={() => handleTimeRangeChange('week')}
              >
                <Text
                  style={[
                    styles.timeRangeText,
                    selectedTimeRange === 'week' && styles.timeRangeTextActive
                  ]}
                >
                  Week
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.timeRangeButton,
                  selectedTimeRange === 'month' && styles.timeRangeButtonActive
                ]}
                onPress={() => handleTimeRangeChange('month')}
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
                onPress={() => handleTimeRangeChange('year')}
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
            </View>
            
            {/* Stats Overview */}
            <View style={styles.statsOverview}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Calendar size={20} color="#4F46E5" />
                </View>
                <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Dumbbell size={20} color="#4F46E5" />
                </View>
                <Text style={styles.statValue}>
                  {stats.totalVolume.toLocaleString()}kg
                </Text>
                <Text style={styles.statLabel}>Volume</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Clock size={20} color="#4F46E5" />
                </View>
                <Text style={styles.statValue}>
                  {formatDuration(stats.avgDuration)}
                </Text>
                <Text style={styles.statLabel}>Avg Duration</Text>
              </View>
            </View>
            
            {/* Volume Chart */}
            {volumeData.length > 0 && (
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Volume Progress</Text>
                  <TouchableOpacity>
                    <BarChartIcon size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.chartContainer}>
  <LineChart
    data={{
      labels: volumeData.slice(-6).map(item => item.date.substring(5)),
      datasets: [
        {
          data: volumeData.slice(-6).map(item => item.volume),
          color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
          strokeWidth: 2
        }
      ]
    }}
    width={screenWidth - 64}
    height={200}
    chartConfig={{
      backgroundColor: '#FFFFFF',
      backgroundGradientFrom: '#FFFFFF',
      backgroundGradientTo: '#FFFFFF',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
      propsForDots: {
        r: "5",
        strokeWidth: "2",
        stroke: "#4F46E5"
      }
    }}
    bezier
    style={{
      borderRadius: 8
    }}
  />
</View>
                
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#4F46E5' }]} />
                    <Text style={styles.legendText}>Total Volume</Text>
                  </View>
                </View>
              </View>
            )}
            
            {/* Muscle Group Distribution */}
            {muscleGroupData.length > 0 && (
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Muscle Group Focus</Text>
                  <TouchableOpacity>
                    <TrendingUp size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.muscleDistribution}>
                  {muscleGroupData.slice(0, 5).map((item, index) => (
                    <View key={item.muscleGroup} style={styles.muscleDistributionItem}>
                      <View style={styles.muscleDistributionLabel}>
                        <Text style={styles.muscleDistributionName}>{item.muscleGroup}</Text>
                        <Text style={styles.muscleDistributionPercentage}>{item.percentage}%</Text>
                      </View>
                      <View style={styles.muscleDistributionBarContainer}>
                        <View 
                          style={[
                            styles.muscleDistributionBar, 
                            { width: `${item.percentage}%` },
                            index === 0 && { backgroundColor: '#4F46E5' },
                            index === 1 && { backgroundColor: '#818CF8' },
                            index === 2 && { backgroundColor: '#A5B4FC' },
                            index === 3 && { backgroundColor: '#C7D2FE' },
                            index === 4 && { backgroundColor: '#E0E7FF' }
                          ]} 
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Workout Frequency */}
            {workoutFrequencyData.some(d => d.count > 0) && (
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Workout Frequency</Text>
                  <TouchableOpacity>
                    <CalendarIcon size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.frequencyContainer}>
                  {workoutFrequencyData.map((item) => (
                    <View key={item.day} style={styles.frequencyItem}>
                      <Text style={styles.frequencyDay}>{item.day}</Text>
                      <View style={styles.frequencyBarContainer}>
                        <View 
                          style={[
                            styles.frequencyBar, 
                            { height: `${Math.min(100, item.count * 20)}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.frequencyCount}>{item.count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {selectedMuscleGroup && (
              <View style={styles.activeFilterContainer}>
                <Text style={styles.activeFilterLabel}>Filtered by:</Text>
                <Chip 
                  style={styles.activeFilterChip}
                  onClose={() => setSelectedMuscleGroup(null)}
                >
                  {selectedMuscleGroup}
                </Chip>
              </View>
            )}
            
            {filteredWorkouts.length > 0 ? (
              <Text style={styles.sectionTitle}>Workout Log</Text>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No completed workouts found.
                </Text>
                <Button 
                  mode="contained" 
                  style={styles.emptyStateButton}
                  onPress={() => navigation.navigate('Workouts')}
                >
                  Start a Workout
                </Button>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.workoutItem}
            onPress={() => {
              // Navigate to workout details screen
              // This would be implemented in a complete app
            }}
          >
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutName}>{item.name}</Text>
              <Text style={styles.workoutDate}>
                {formatDate(item.completedAt || item.startedAt || '')}
              </Text>
            </View>
            
            <View style={styles.workoutStats}>
              <View style={styles.workoutStat}>
                <Dumbbell size={14} color="#6B7280" />
                <Text style={styles.workoutStatText}>
                  {item.exercises.length} exercises
                </Text>
              </View>
              
              <View style={styles.workoutStat}>
                <Clock size={14} color="#6B7280" />
                <Text style={styles.workoutStatText}>
                  {formatDuration(item.duration)}
                </Text>
              </View>
              
              {item.totalVolume && (
                <View style={styles.workoutStat}>
                  <TrendingUp size={14} color="#6B7280" />
                  <Text style={styles.workoutStatText}>
                    {item.totalVolume.toLocaleString()}kg
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.workoutDetails}>
              {item.exercises.slice(0, 3).map((exercise, index) => (
                <Text key={index} style={styles.workoutExercise}>
                  • {exercise.name}
                </Text>
              ))}
              
              {item.exercises.length > 3 && (
                <Text style={styles.workoutMoreExercises}>
                  +{item.exercises.length - 3} more
                </Text>
              )}
            </View>
            
            <View style={styles.workoutItemFooter}>
              <ChevronRight size={18} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No workout history found. Start tracking your workouts to see your progress.
              </Text>
              <Button 
                mode="contained" 
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('Workouts')}
              >
                Start a Workout
              </Button>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />
      
      {/* Filter Modal */}
      <Portal>
        <Modal
          visible={showFilterModal}
          onDismiss={() => setShowFilterModal(false)}
          contentContainerStyle={styles.filterModal}
        >
          <Text style={styles.filterModalTitle}>Filter Workouts</Text>
          
          <Text style={styles.filterSectionTitle}>Muscle Groups</Text>
          
          <View style={styles.muscleGroupChips}>
            {muscleGroupData.map((item) => (
              <Chip 
                key={item.muscleGroup}
                style={[
                  styles.muscleGroupChip,
                  selectedMuscleGroup === item.muscleGroup && styles.muscleGroupChipSelected
                ]}
                onPress={() => handleFilterByMuscle(item.muscleGroup)}
                mode="outlined"
              >
                {item.muscleGroup}
              </Chip>
            ))}
          </View>
          
          <Divider style={styles.filterDivider} />
          
          <View style={styles.filterActions}>
            <Button 
              mode="outlined" 
              onPress={() => handleFilterByMuscle(null)}
              style={styles.filterClearButton}
            >
              Clear Filters
            </Button>
            
            <Button 
              mode="contained" 
              onPress={() => setShowFilterModal(false)}
              style={styles.filterApplyButton}
            >
              Apply
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
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.gray[900],
  },
  filterButton: {
    padding: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 8,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeRangeButtonActive: {
    backgroundColor: '#F3F4F6',
  },
  timeRangeText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#6B7280',
  },
  timeRangeTextActive: {
    color: colors.gray[900],
  },
  statsOverview: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.gray[900],
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.gray[900],
  },
  chartContainer: {
    height: 200,
    marginBottom: 16,
  },
  chartPlaceholder: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#6B7280',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  muscleDistribution: {
    marginBottom: 8,
  },
  muscleDistributionItem: {
    marginBottom: 12,
  },
  muscleDistributionLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  muscleDistributionName: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#374151',
  },
  muscleDistributionPercentage: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.gray[900],
  },
  muscleDistributionBarContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  muscleDistributionBar: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  frequencyContainer: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  frequencyItem: {
    flex: 1,
    alignItems: 'center',
  },
  frequencyDay: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  frequencyBarContainer: {
    width: 20,
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  frequencyBar: {
    width: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  frequencyCount: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.gray[900],
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.gray[900],
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  workoutItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutName: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.gray[900],
  },
  workoutDate: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  workoutStats: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutStatText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  workoutDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  workoutExercise: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  workoutMoreExercises: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  workoutItemFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: fonts.regular,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#4F46E5',
  },
  filterModal: {
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
  filterModalTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.gray[900],
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  muscleGroupChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  muscleGroupChip: {
    backgroundColor: '#F9FAFB',
  },
  muscleGroupChipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  filterDivider: {
    marginVertical: 16,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  filterClearButton: {
    borderColor: '#6B7280',
  },
  filterApplyButton: {
    backgroundColor: '#4F46E5',
  },
  activeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  activeFilterLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#4B5563',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#EEF2FF',
  },
});