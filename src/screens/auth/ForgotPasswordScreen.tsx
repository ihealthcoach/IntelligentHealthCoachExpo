import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { AuthScreenProps } from '../../types/navigation';

// Fonts
import { fonts } from '../../styles/fonts';

export default function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setMessage('Please enter your email address');
      setIsError(true);
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      setIsError(false);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'intelligent-health-coach://reset-password',
      });
      
      if (error) {
        setMessage(error.message);
        setIsError(true);
      } else {
        setMessage('Password reset link sent to your email');
        setIsError(false);
      }
    } catch (err) {
      setMessage('An unexpected error occurred. Please try again.');
      setIsError(true);
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email to receive a password reset link
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            disabled={loading}
          />

          {message ? (
            <HelperText type={isError ? 'error' : 'info'} visible={!!message}>
              {message}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleResetPassword}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Send Reset Link
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.backButton}
            disabled={loading}
          >
            Back to Login
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  backButton: {
    marginTop: 24,
  },
});