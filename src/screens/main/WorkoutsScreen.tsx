import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button, FAB } from 'react-native-paper';
import { MainTabScreenProps } from '../../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

// Components
import Icon from '../../components/Icons';
import { IconName } from '../../components/Icons';

// Mock data for now
const mockWorkouts = [
  { id: '1', name: 'Upper Body Strength', date: '2023-04-01', exercises: 5 },
  { id: '2', name: 'Leg Day', date: '2023-04-03', exercises: 6 },
  { id: '3', name: 'Core & Cardio', date: '2023-04-05', exercises: 8 },
];

export default function WorkoutsScreen({ navigation }: MainTabScreenProps<'Workouts'>) {
  const [workouts, setWorkouts] = useState(mockWorkouts);

  const renderWorkoutCard = ({ item }: { item: typeof mockWorkouts[0] }) => (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <Text variant="titleLarge">{item.name}</Text>
        <Text variant="bodyMedium">Date: {item.date}</Text>
        <Text variant="bodyMedium">Exercises: {item.exercises}</Text>
      </Card.Content>
      <Card.Actions>
      <Button onPress={() => navigation.navigate('WorkoutOverviewScreen', { workoutId: item.id })}>
  View Details
</Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.header}>
        Your Workouts
      </Text>

      {workouts.length > 0 ? (
        <FlatList
          data={workouts}
          renderItem={renderWorkoutCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge">You haven't logged any workouts yet.</Text>
          <Button 
  mode="contained" 
  style={styles.startButton}
  onPress={() => navigation.navigate('WorkoutOverviewScreen')}
>
  Start Your First Workout
</Button>
        </View>
      )}

<FAB
  icon="plus"
  style={styles.fab}
  onPress={() => {
    // Clear any existing workout data in AsyncStorage
    AsyncStorage.removeItem('current_workout')
      .then(() => {
        // Navigate to workout creation screen using the enhanced version
        navigation.navigate('WorkoutOverviewScreen');
      })
      .catch(error => {
        console.error('Error clearing workout data:', error);
        // Navigate anyway
        navigation.navigate('WorkoutOverviewScreen');
      });
  }}
/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  list: {
    paddingBottom: 80, // Space for FAB
  },
  card: {
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  startButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.indigo[600],
  },
});