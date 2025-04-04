import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Auth Stack Param List
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Tab Param List
export type MainTabParamList = {
  Home: undefined;
  Workouts: undefined;
  Exercises: undefined;
  Profile: undefined;
};

// Main Stack Param List (includes screens accessible from tabs)
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  WorkoutExerciseOverview: undefined;
};

// Root Stack Param List (combines Auth and Main)
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

// Auth screen props
export type AuthScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

// Main tab screen props with composite navigation
export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<MainStackParamList>
  >;

// Main stack screen props
export type MainStackScreenProps<T extends keyof MainStackParamList> = 
  NativeStackScreenProps<MainStackParamList, T>;

// Root screen props
export type RootScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;