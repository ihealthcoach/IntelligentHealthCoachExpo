import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// For testing purposes, we can fallback to environment variables if they exist in .env
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Using fallback values for Supabase credentials');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are not set!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});