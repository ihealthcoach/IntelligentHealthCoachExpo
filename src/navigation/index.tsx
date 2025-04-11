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

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.bottomNav}>
      <View style={styles.navContent}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <HomeIcon size={24} color="#111827" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('History')}
        >
          <BarChart3 size={24} color="#111827" />
          <Text style={styles.navText}>Activity</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('Workouts')}
        >
          <Plus size={24} color="#FCFDFD" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Exercises')}
        >
          <ChefHat size={24} color="#111827" />
          <Text style={styles.navText}>Food</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Workouts')}
        >
          <Dumbbell size={24} color="#111827" />
          <Text style={styles.navText}>Workouts</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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

// Styles for the custom tab bar
const styles = StyleSheet.create({
  bottomNav: {
    height: 60,
    backgroundColor: 'rgba(252, 253, 253, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  navContent: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    height: 52,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#111827',
    marginTop: 2,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});