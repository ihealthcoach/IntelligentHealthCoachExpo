import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Avatar, Button, Card, TextInput, Divider } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { MainScreenProps } from '../../types/navigation';
import { supabase } from '../../services/supabase';

// Mock profile data
const initialProfile = {
  username: '',
  fullName: '',
  age: '',
  height: '',
  weight: '',
  fitnessGoal: '',
};

export default function ProfileScreen({ navigation }: MainScreenProps<'Profile'>) {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // In a real app, fetch profile from Supabase
      // For now, we'll just use mock data
      setProfile({
        username: 'fitnessuser',
        fullName: 'John Doe',
        age: '32',
        height: '180',
        weight: '75',
        fitnessGoal: 'Build muscle and improve overall fitness',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      // In a real app, save the profile to Supabase
      console.log('Saving profile:', profile);
      
      // End editing mode
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text size={80} label={profile.username.substring(0, 2).toUpperCase()} />
        <Text variant="headlineSmall" style={styles.username}>
          {profile.username}
        </Text>
        <Text variant="bodyMedium">{user?.email}</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleLarge">Personal Information</Text>
            {!editing ? (
              <Button onPress={() => setEditing(true)}>Edit</Button>
            ) : (
              <Button onPress={saveProfile} loading={loading}>
                Save
              </Button>
            )}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.field}>
            <Text variant="bodyMedium">Full Name</Text>
            {editing ? (
              <TextInput
                value={profile.fullName}
                onChangeText={(value) => handleChange('fullName', value)}
                style={styles.input}
                mode="outlined"
                dense
              />
            ) : (
              <Text variant="bodyLarge">{profile.fullName}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text variant="bodyMedium">Age</Text>
            {editing ? (
              <TextInput
                value={profile.age}
                onChangeText={(value) => handleChange('age', value)}
                style={styles.input}
                mode="outlined"
                dense
                keyboardType="number-pad"
              />
            ) : (
              <Text variant="bodyLarge">{profile.age} years</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text variant="bodyMedium">Height</Text>
            {editing ? (
              <TextInput
                value={profile.height}
                onChangeText={(value) => handleChange('height', value)}
                style={styles.input}
                mode="outlined"
                dense
                keyboardType="number-pad"
              />
            ) : (
              <Text variant="bodyLarge">{profile.height} cm</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text variant="bodyMedium">Weight</Text>
            {editing ? (
              <TextInput
                value={profile.weight}
                onChangeText={(value) => handleChange('weight', value)}
                style={styles.input}
                mode="outlined"
                dense
                keyboardType="number-pad"
              />
            ) : (
              <Text variant="bodyLarge">{profile.weight} kg</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text variant="bodyMedium">Fitness Goal</Text>
            {editing ? (
              <TextInput
                value={profile.fitnessGoal}
                onChangeText={(value) => handleChange('fitnessGoal', value)}
                style={styles.input}
                mode="outlined"
                dense
                multiline
              />
            ) : (
              <Text variant="bodyLarge">{profile.fitnessGoal}</Text>
            )}
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        style={styles.signOutButton}
        onPress={signOut}
      >
        Sign Out
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
  },
  username: {
    marginTop: 16,
    marginBottom: 4,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  input: {
    marginTop: 4,
  },
  signOutButton: {
    marginVertical: 24,
  }
});