import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';

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

// Root Stack Param List (combines Auth and Main)
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Auth screen props
export type AuthScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

// Main tab screen props
export type MainScreenProps<T extends keyof MainTabParamList> = 
  NativeStackScreenProps<MainTabParamList, T>;

// Root screen props
export type RootScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;