import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  ScrollView, 
  TextInput, 
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { AuthScreenProps } from '../../types/navigation';
import { HelperText } from 'react-native-paper';

export default function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { signIn } = useAuth();
  
  // State for the main screen
  const [loading, setLoading] = useState(false);
  
  // State for the email login modal
  const [emailLoginVisible, setEmailLoginVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleEmailLoginPress = () => {
    setEmailLoginVisible(true);
  };

  const handleCloseEmailLogin = () => {
    setEmailLoginVisible(false);
  };

  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError(signInError.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  // Email Login Form Modal
  const renderEmailLoginModal = () => (
    <Modal
      visible={emailLoginVisible}
      animationType="slide"
      transparent={false}
    >
      <SafeAreaView style={styles.modalContainer}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <ScrollView contentContainerStyle={styles.modalScrollContainer}>
            <View style={styles.modalHeaderContainer}>
              <TouchableOpacity onPress={handleCloseEmailLogin} style={styles.backButton}>
                <ArrowLeft width={24} height={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Sign in with Email</Text>
              <View style={styles.placeholderView} />
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  disabled={loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry={secureTextEntry}
                    disabled={loading}
                  />
                  <TouchableOpacity onPress={toggleSecureEntry} style={styles.eyeButton}>
                    {secureTextEntry ? (
                      <Eye width={20} height={20} color="#9ca3af" />
                    ) : (
                      <EyeOff width={20} height={20} color="#9ca3af" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {error ? (
                <HelperText type="error" visible={!!error}>
                  {error}
                </HelperText>
              ) : null}

              <TouchableOpacity 
                style={styles.forgotPasswordButton}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.mainFrame}>
          <View style={styles.logoContainer}>
            <View style={styles.logo} />
          </View>
          
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Welcome back</Text>
            <Text style={styles.headerSubtitle}>
              Sign in to continue your journey with {'\n'}Intelligent Health Coach
            </Text>
          </View>
          
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <View style={styles.iconContainer}>
                <Image 
                  source={{ uri: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg' }} 
                  style={styles.icon}
                />
              </View>
              <Text style={styles.buttonText}>Continue with Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.socialButton}>
              <View style={styles.iconContainer}>
                <Image 
                  source={{ uri: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg' }} 
                  style={styles.icon}
                />
              </View>
              <Text style={styles.buttonText}>Continue with Facebook</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.socialButton}>
              <View style={styles.iconContainer}>
                <Image 
                  source={{ uri: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg' }} 
                  style={styles.icon}
                />
              </View>
              <Text style={styles.buttonText}>Continue with Apple</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleEmailLoginPress}
            >
              <View style={styles.iconContainer}>
                <Mail width={24} height={24} color="#111827" strokeWidth={1.5} />
              </View>
              <Text style={styles.buttonText}>Continue with Email</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={handleSignUp}
          >
            <Text style={styles.signInText}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Email Login Modal */}
      {renderEmailLoginModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f7',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
  },
  mainFrame: {
    width: '92%',
    maxWidth: 360,
    paddingTop: 96,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logoContainer: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 84,
    height: 96,
    backgroundColor: '#81f5e2',
    borderRadius: 10,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  socialButtonsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  socialButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#fcfefe',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    width: 24,
    height: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  signInButton: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f3f4f7',
  },
  modalScrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  placeholderView: {
    width: 40, // To balance the back button
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    height: 52,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 5,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#4F46E5',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#818CF8',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
});