import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { MainScreenProps } from '../../types/navigation';

export default function HomeScreen({ navigation }: MainScreenProps<'Home'>) {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Welcome to Intelligent Health Coach</Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Your personalized fitness companion
      </Text>

      <View style={styles.userInfo}>
        <Text variant="bodyMedium">Logged in as: {user?.email}</Text>
      </View>

      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Workouts')}
          style={styles.button}
        >
          View Workouts
        </Button>
        
        <Button
          mode="contained" 
          onPress={() => navigation.navigate('Exercises')}
          style={styles.button}
        >
          Browse Exercises
        </Button>
        
        <Button 
          mode="outlined" 
          onPress={signOut}
          style={styles.button}
        >
          Sign Out
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginBottom: 24,
  },
  userInfo: {
    marginVertical: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  actionButtons: {
    width: '100%',
  },
  button: {
    marginVertical: 8,
  }
});