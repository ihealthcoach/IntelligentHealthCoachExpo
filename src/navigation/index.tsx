import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { 
  Home as HomeIcon, 
  Dumbbell, 
  Calendar, 
  User, 
  BarChart
} from 'lucide-react-native';

import { useAuth } from '../contexts/AuthContext';
import { 
  RootStackParamList, 
  MainTabParamList, 
  AuthStackParamList,
  MainStackParamList
} from '../types/navigation';

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
import EnhancedWorkoutOverviewScreen from '../screens/main/WorkoutOverviewScreen';
import EnhancedWorkoutTrackingScreen from '../screens/main/WorkoutTrackingScreen';
import WorkoutHistoryScreen from '../screens/main/WorkoutHistoryScreen';
import ExerciseDetailScreen from '../screens/main/ExerciseDetailScreen';

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
        // Make sure size is a number
        const iconSize = typeof size === 'number' ? size : 24;
        
        // Return the appropriate icon based on route name
        switch (route.name) {
          case 'Home':
            return <HomeIcon size={iconSize} color={color} />;
          case 'Workouts':
            return <Dumbbell size={iconSize} color={color} />;
          case 'Exercises':
            return <Calendar size={iconSize} color={color} />;
          case 'History':
            return <BarChart size={iconSize} color={color} />;
          case 'Profile':
            return <User size={iconSize} color={color} />;
          default:
            return <HomeIcon size={iconSize} color={color} />;
        }
      },
      tabBarActiveTintColor: '#4F46E5',
      tabBarInactiveTintColor: '#6B7280',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarLabelStyle: {
        fontSize: 12,
      },
      headerShown: false,
    })}
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
      name="WorkoutExerciseOverview" 
      component={EnhancedWorkoutOverviewScreen}
    />
    <MainStack.Screen 
      name="WorkoutTracking" 
      component={EnhancedWorkoutTrackingScreen}
    />
    <MainStack.Screen 
      name="ExerciseDetail" 
      component={ExerciseDetailScreen}
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