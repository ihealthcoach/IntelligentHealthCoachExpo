import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { 
  RootStackParamList, 
  MainTabParamList, 
  AuthStackParamList,
  MainStackParamList
} from '../types/navigation';

// Import screens
import HomeScreen from '../screens/main/HomeScreen';
import WorkoutsScreen from '../screens/main/WorkoutsScreen';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Additional main screens
import ExercisesScreen from '../screens/main/ExercisesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import WorkoutExerciseOverview from '../screens/main/WorkoutExerciseOverview';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Auth Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </AuthStack.Navigator>
);

// Tab Navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: string;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Workouts') {
          iconName = focused ? 'fitness' : 'fitness-outline';
        } else if (route.name === 'Exercises') {
          iconName = focused ? 'barbell' : 'barbell-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        } else {
          iconName = 'help-circle';
        }

        // Make sure size is a number
        const iconSize = typeof size === 'number' ? size : 24;
        
        // Return the Ionicons component with proper typing
        return <Ionicons name={iconName as any} size={iconSize} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Workouts" component={WorkoutsScreen} />
    <Tab.Screen name="Exercises" component={ExercisesScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Main Navigator
const MainNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen 
      name="MainTabs" 
      component={TabNavigator} 
      options={{ headerShown: false }}
    />
    <MainStack.Screen 
      name="WorkoutExerciseOverview" 
      component={WorkoutExerciseOverview}
      options={{ headerShown: false }}
    />
  </MainStack.Navigator>
);

// Root Navigation
export const Navigation = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size={36} color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};