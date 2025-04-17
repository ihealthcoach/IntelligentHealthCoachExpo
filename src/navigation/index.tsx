import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { 
  Home as HomeIcon, 
  Dumbbell, 
  Calendar, 
  User, 
  BarChart3,
  ChefHat,
  Plus
} from 'lucide-react-native';

import { useAuth } from '../contexts/AuthContext';
import { 
  RootStackParamList, 
  MainTabParamList, 
  AuthStackParamList,
  MainStackParamList
} from '../types/navigation';
import CustomTabBar from '../components/CustomTabBar';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main screens
import HomeScreen from '../screens/main/HomeScreen';
import WorkoutsScreen from '../screens/main/WorkoutsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ExercisesScreen from '../screens/main/ExercisesScreen';

// Enhanced screens (new implementations)
import WorkoutOverviewScreen from '../screens/main/WorkoutOverviewScreen';
import WorkoutTrackingScreen from '../screens/main/WorkoutTrackingScreen';
import WorkoutHistoryScreen from '../screens/main/WorkoutHistoryScreen';
import ExerciseDetailScreen from '../screens/main/ExerciseDetailScreen';

//Gif checker
import GifCheckerScreen from '../screens/dev/GifCheckerScreen';

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

// Tab Navigator with Custom Tab Bar
const TabNavigator = () => (
  <Tab.Navigator
    tabBar={props => <CustomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Workouts" component={WorkoutsScreen} />
    <Tab.Screen name="Exercises" component={ExercisesScreen} />
    <Tab.Screen name="History" component={WorkoutHistoryScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Main Navigator
const MainNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen 
      name="MainTabs" 
      component={TabNavigator} 
    />
    <MainStack.Screen 
      name="WorkoutOverviewScreen" 
      component={WorkoutOverviewScreen}
    />
    <MainStack.Screen 
      name="WorkoutTracking" 
      component={WorkoutTrackingScreen}
    />
    <MainStack.Screen 
      name="ExerciseDetail" 
      component={ExerciseDetailScreen}
    />
    <MainStack.Screen 
      name="GifChecker" 
      component={GifCheckerScreen}
    />
  </MainStack.Navigator>
);

// Root Navigation
export const Navigation = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
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