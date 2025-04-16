import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { ArrowLeft, CheckCircle, XCircle, List } from 'lucide-react-native';
import { supabase } from '../../services/supabase';

// Fonts
import { fonts } from '../../styles/fonts';

// Colors
import { colors } from '../../styles/colors';

type Exercise = {
    id: string;
    name: string;
    gif_url: string | null;
    isValid?: boolean;
    reason?: string;
  };
  
  export default function GifCheckerScreen({ navigation }) {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({ valid: 0, invalid: 0, total: 0, checked: 0 });
    const [filter, setFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  
    useEffect(() => {
      fetchAllExercises();
    }, []);
  
    const fetchAllExercises = async () => {
      try {
        setLoading(true);
        let allExercises: Exercise[] = [];
        let hasMore = true;
        let page = 0;
        const pageSize = 1000; // Supabase limit
        
        // Fetch all exercises using pagination
        while (hasMore) {
          const from = page * pageSize;
          const to = from + pageSize - 1;
          
          console.log(`Fetching exercises ${from} to ${to}`);
          
          const { data, error, count } = await supabase
            .from('exercises')
            .select('id, name, gif_url', { count: 'exact' })
            .range(from, to);
            
          if (error) {
            console.error('Error fetching exercises:', error);
            break;
          }
          
          if (data && data.length > 0) {
            allExercises = [...allExercises, ...data];
            page++;
            
            // Check if we've fetched all exercises
            if (data.length < pageSize || (count !== null && allExercises.length >= count)) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }
        
        console.log(`Fetched ${allExercises.length} exercises total`);
        setExercises(allExercises);
        setStats({ valid: 0, invalid: 0, total: allExercises.length, checked: 0 });
        
      } catch (err) {
        console.error('Error in fetchAllExercises:', err);
        Alert.alert('Error', 'Failed to fetch exercises');
      } finally {
        setLoading(false);
      }
    };
  
    const checkGifReferences = async () => {
      if (!exercises.length) return;
      
      setChecking(true);
      setProgress(0);
      
      try {
        let validCount = 0;
        let invalidCount = 0;
        const batchSize = 20;
        
        const exercisesToProcess = [...exercises];
        
        for (let i = 0; i < exercisesToProcess.length; i += batchSize) {
          const batch = exercisesToProcess.slice(i, i + batchSize);
          
          const processedBatch = await Promise.all(batch.map(async (exercise) => {
            const result = { ...exercise };
            
            if (!result.gif_url) {
              result.isValid = false;
              result.reason = 'No GIF URL';
              invalidCount++;
              return result;
            }
            
            // Extract filename from gif_url
            let filename = result.gif_url;
            if (filename.includes('/')) {
              filename = filename.split('/').pop() || '';
            }
            
            // Construct the full URL like your app does
            const fullUrl = `https://fleiivpyjkvahakriuta.supabase.co/storage/v1/object/public/exercises/gifs/${filename}`;
            
            // Try to fetch the URL to see if it exists
            try {
              const response = await fetch(fullUrl, { method: 'HEAD' });
              if (response.ok) {
                result.isValid = true;
                validCount++;
              } else {
                result.isValid = false;
                result.reason = `HTTP status: ${response.status}`;
                invalidCount++;
              }
            } catch (fetchErr) {
              result.isValid = false;
              result.reason = `Fetch error: ${fetchErr.message}`;
              invalidCount++;
            }
            
            return result;
          }));
          
          // Update exercises array
          for (let j = 0; j < processedBatch.length; j++) {
            exercisesToProcess[i + j] = processedBatch[j];
          }
          
          // Update progress and stats
          const progress = Math.min(100, Math.round(((i + batch.length) / exercisesToProcess.length) * 100));
          setProgress(progress);
          setStats({
            valid: validCount,
            invalid: invalidCount,
            total: exercisesToProcess.length,
            checked: i + batch.length
          });
          
          setExercises([...exercisesToProcess]);
          
          // Small delay to allow UI to update
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Final update
        setExercises(exercisesToProcess);
        setStats({
          valid: validCount,
          invalid: invalidCount,
          total: exercisesToProcess.length,
          checked: exercisesToProcess.length
        });
        
        Alert.alert(
          'Check Complete',
          `Checked ${exercisesToProcess.length} exercises\nValid: ${validCount}\nInvalid: ${invalidCount}`
        );
        
      } catch (err) {
        console.error('Error checking GIFs:', err);
        Alert.alert('Error', 'Failed to complete check');
      } finally {
        setChecking(false);
      }
    };
  
    // Get filtered exercises based on validation status
    const getFilteredExercises = () => {
        // Return all exercises if filter is 'all' or if exercises haven't been checked yet
        if (filter === 'all' || stats.checked === 0) {
          return exercises;
        }
        
        // Filter based on validation status
        return exercises.filter(exercise => {
          if (filter === 'valid') {
            return exercise.isValid === true;
          } else {
            return exercise.isValid === false;
          }
        }).sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
      };

    // Render the filter toggle component
const renderFilterToggle = () => (
    <View style={styles.toggleContainer}>
      <TouchableOpacity 
        style={[
          styles.toggleButton, 
          filter === 'all' && styles.toggleButtonActive
        ]}
        onPress={() => setFilter('all')}
      >
        <List size={16} color={filter === 'all' ? "#FFFFFF" : "#4B5563"} />
        <Text style={[
          styles.toggleText,
          filter === 'all' && styles.toggleTextActive
        ]}>
          All ({exercises.length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.toggleButton, 
          filter === 'valid' && styles.toggleButtonActive
        ]}
        onPress={() => setFilter('valid')}
      >
        <CheckCircle size={16} color={filter === 'valid' ? "#FFFFFF" : "#10B981"} />
        <Text style={[
          styles.toggleText,
          filter === 'valid' && styles.toggleTextActive
        ]}>
          Valid ({exercises.filter(ex => ex.isValid === true).length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.toggleButton, 
          filter === 'invalid' && styles.toggleButtonActive
        ]}
        onPress={() => setFilter('invalid')}
      >
        <XCircle size={16} color={filter === 'invalid' ? "#FFFFFF" : "#EF4444"} />
        <Text style={[
          styles.toggleText,
          filter === 'invalid' && styles.toggleTextActive
        ]}>
          Invalid ({exercises.filter(ex => ex.isValid === false).length})
        </Text>
      </TouchableOpacity>
    </View>
  );
  
    // Export the list of invalid exercises
    const exportInvalidList = () => {
      const invalidExercises = exercises.filter(ex => ex.isValid === false);
      if (invalidExercises.length === 0) {
        Alert.alert('No Invalid Exercises', 'There are no invalid exercises to export');
        return;
      }
  
      const invalidList = invalidExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        gif_url: ex.gif_url,
        reason: ex.reason
      }));
  
      console.log('Invalid exercises:', JSON.stringify(invalidList, null, 2));
      Alert.alert('Export Complete', `Exported ${invalidList.length} invalid exercises to console`);
    };
  
    // Fix all exercises with dashes in filename
    const fixDashInFilenames = async () => {
      if (!exercises.length) return;
      
      try {
        const exercisesWithDash = exercises.filter(ex => 
          ex.gif_url && ex.gif_url.includes('-')
        );
        
        if (exercisesWithDash.length === 0) {
          Alert.alert('No Issues Found', 'No exercises found with dashes in filenames');
          return;
        }
        
        Alert.alert(
          'Fix Filenames',
          `Found ${exercisesWithDash.length} exercises with dashes in filenames. Do you want to replace dashes with underscores?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Fix All', 
              onPress: async () => {
                let fixedCount = 0;
                
                for (const exercise of exercisesWithDash) {
                  if (!exercise.gif_url) continue;
                  
                  const updatedUrl = exercise.gif_url.replace(/-/g, '_');
                  
                  const { error } = await supabase
                    .from('exercises')
                    .update({ gif_url: updatedUrl })
                    .eq('id', exercise.id);
                    
                  if (!error) fixedCount++;
                }
                
                Alert.alert(
                  'Fix Complete',
                  `Fixed ${fixedCount} of ${exercisesWithDash.length} exercises`
                );
                
                // Refresh the exercise list
                fetchAllExercises();
              }
            }
          ]
        );
      } catch (err) {
        console.error('Error fixing filenames:', err);
        Alert.alert('Error', 'Failed to fix filenames');
      }
    };
  
    return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="colors.gray[100]" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GIF Reference Checker</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Stats */}
      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={[styles.statCard, filter === 'all' && styles.selectedStatCard]}
          onPress={() => setFilter('all')}
        >
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.statCard, styles.validStatCard, filter === 'valid' && styles.selectedStatCard]}
          onPress={() => setFilter('valid')}
        >
          <Text style={styles.statValue}>{stats.valid}</Text>
          <Text style={styles.statLabel}>Valid</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.statCard, styles.invalidStatCard, filter === 'invalid' && styles.selectedStatCard]}
          onPress={() => setFilter('invalid')}
        >
          <Text style={styles.statValue}>{stats.invalid}</Text>
          <Text style={styles.statLabel}>Invalid</Text>
        </TouchableOpacity>
      </View>
      
      {/* Progress bar during checking */}
      {checking && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {stats.checked} / {stats.total} checked ({progress}%)
          </Text>
        </View>
      )}
      
      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, checking && styles.disabledButton]}
          onPress={checkGifReferences}
          disabled={checking || loading}
        >
          <Text style={styles.actionButtonText}>
            {checking ? 'Checking...' : 'Check GIF References'}
          </Text>
        </TouchableOpacity>
      </View>

              {/* Filter Toggle */}
{exercises.length > 0 && !loading && renderFilterToggle()}
      
      {/* Exercise List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      ) : (
<FlatList
  data={getFilteredExercises()}
  keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {checking 
                  ? `Checking GIFs... (${stats.checked}/${stats.total})` 
                  : `Exercise List (${getFilteredExercises().length})`}
              </Text>
              {checking && (
                <ActivityIndicator size="small" color="#4F46E5" />
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {loading 
                  ? 'Loading exercises...' 
                  : filter !== 'all' 
                    ? `No ${filter} exercises found` 
                    : 'No exercises found'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.exerciseItem}>
              {/* Exercise Image Container (similar to ExercisesScreen) */}
              <View style={styles.exerciseImageContainer}>
                {item.isValid !== undefined && (
                  <View style={[
                    styles.validationBadge, 
                    item.isValid ? styles.validBadge : styles.invalidBadge
                  ]}>
                    {item.isValid ? (
                      <CheckCircle size={12} color="#FFFFFF" />
                    ) : (
                      <XCircle size={12} color="#FFFFFF" />
                    )}
                  </View>
                )}
                <View style={styles.imageWrapper}>
                  <Image 
                    source={
                      item.gif_url 
                        ? { uri: `https://fleiivpyjkvahakriuta.supabase.co/storage/v1/object/public/exercises/gifs/${item.gif_url.split('/').pop()}` }
                        : { uri: 'https://via.placeholder.com/68x68/333' }
                    }
                    style={styles.exerciseImage} 
                    resizeMode="cover"
                  />
                  <View style={styles.blendOverlay} />
                </View>
              </View>
              
              <View style={styles.exerciseDetails1}>
                <Text style={styles.exerciseName1}>{item.name}</Text>
                <Text style={styles.exerciseUrl1} numberOfLines={1}>
                  {item.gif_url ? item.gif_url.split('/').pop() : 'No GIF URL'}
                </Text>
                {!item.isValid && item.reason && (
                  <Text style={styles.reasonText}>{item.reason}</Text>
                )}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.gray[900],
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedStatCard: {
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  validStatCard: {
    backgroundColor: '#ECFDF5',
  },
  invalidStatCard: {
    backgroundColor: '#FEF2F2',
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.gray[900],
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  progressContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#818CF8',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
  },
  listHeaderText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#4B5563',
  },
  exerciseItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  exerciseDetails: {
    gap: 4,
  },
  exerciseName: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.gray[900],
  },
  exerciseUrl: {
    fontSize: 12,
    color: '#6B7280',
  },
  validationContainer: {
    marginTop: 4,
  },
  validIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validText: {
    fontSize: 14,
    color: '#10B981',
  },
  invalidIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  invalidText: {
    fontSize: 14,
    color: '#EF4444',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  toggleButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  toggleText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#4B5563',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  exerciseItem1: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  exerciseImageContainer: {
    width: 120,
    height: 120,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
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
  blendOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240,240,240,0.4)',
  } as any, // Type assertion for mixBlendMode
  validationBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 1,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validBadge: {
    backgroundColor: '#10B981',
  },
  invalidBadge: {
    backgroundColor: '#EF4444',
  },
  exerciseDetails1: {
    flex: 1,
    marginLeft: 4,
  },
  exerciseName1: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.gray[900],
    marginBottom: 2,
  },
  exerciseUrl1: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reasonText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 2,
  },
});