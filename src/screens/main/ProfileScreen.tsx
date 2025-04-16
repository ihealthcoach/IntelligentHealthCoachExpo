import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, SafeAreaView, StatusBar, TextInput, Modal } from 'react-native';
import { ArrowLeft, User, ClipboardList, Globe, Bell, CreditCard, Moon, Star, ChevronRight, Plus } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { Picker } from '@react-native-picker/picker';

// Components
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { MainTabScreenProps } from '../../types/navigation';

// Fonts
import { fonts } from '../../styles/fonts';

export default function ProfileScreen({ navigation }: MainTabScreenProps<'Profile'>) {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState({
    username: '',
    first_name: '',
    last_name: '',
    age: '',
    height: '',
    weight: '',
    goal: '',
    avatar_url: null
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Account');
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);
  const handleGoalSelection = (selectedGoal) => {
    handleChange('goal', selectedGoal);
    setGoalPickerVisible(false);
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        // Update state with actual profile data
        setProfile({
          username: data.username || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          age: data.age?.toString() || '',
          height: data.height?.toString() || '',
          weight: data.weight?.toString() || '',
          goal: data.goal || '',
          avatar_url: data.avatar_url
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.error('No user found');
        return;
      }
      
      // First check if the profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      // Convert numeric strings to numbers
      const profileData = {
        user_id: user.id,
        username: profile.username,
        first_name: profile.first_name,
        last_name: profile.last_name,
        age: profile.age ? parseInt(profile.age) : null,
        height: profile.height ? parseFloat(profile.height) : null,
        weight: profile.weight ? parseFloat(profile.weight) : null,
        goal: profile.goal,
        updated_at: new Date().toISOString()
      };
      
      let error;
      
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', existingProfile.id);
        
        error = updateError;
      } else {
        // Insert new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData);
        
        error = insertError;
      }
      
      if (error) {
        console.error('Supabase error saving profile:', error);
        alert(`Failed to save profile: ${error.message}`);
      } else {
        alert('Profile saved successfully!');
        setEditing(false);
      }
    } catch (error) {
      console.error('Exception saving profile:', error);
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const renderToggle = (value: boolean, onValueChange: () => void) => (
    <View style={styles.toggleContainer}>
      <View style={[styles.toggleBackground, value && styles.toggleBackgroundActive]}>
        <View style={[styles.toggleButton, value && styles.toggleButtonActive]} />
      </View>
    </View>
  );

  const renderSettingItem = (icon: React.ReactNode, title: string, subtitle: string | null = null, showChevron = true) => (
    <TouchableOpacity style={styles.settingItem}>
      <View style={styles.settingItemLeft}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showChevron && (
        <ChevronRight color="#9CA3AF" size={20} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <Header 
  profile={profile}
  getFirstName={() => profile.first_name || 'User'}
  showMenu={false}
  goBack={true}
  title="Profile"
/>

      <ScrollView style={styles.scrollView}>
        {/* Headline and Subtitle */}
        <View style={styles.headlineContainer}>
          <Text style={styles.headline}>Profile</Text>
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>Manage your profile information</Text>
          </View>
        </View>

        {/* Tab Filter */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'Account' && styles.activeTabButton]}
            onPress={() => setActiveTab('Account')}
          >
            <Text style={[styles.tabText, activeTab === 'Account' && styles.activeTabText]}>Account</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'Workout' && styles.activeTabButton]}
            onPress={() => setActiveTab('Workout')}
          >
            <Text style={[styles.tabText, activeTab === 'Workout' && styles.activeTabText]}>Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'More' && styles.activeTabButton]}
            onPress={() => setActiveTab('More')}
          >
            <Text style={[styles.tabText, activeTab === 'More' && styles.activeTabText]}>More</Text>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        {activeTab === 'Account' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.sectionContent}>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => setEditing(!editing)}
              >
                <View style={styles.settingItemLeft}>
                  <View style={styles.iconContainer}>
                    <User size={24} color="#111827" />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>Profile</Text>
                    {editing && <Text style={styles.settingSubtitle}>Editing...</Text>}
                  </View>
                </View>
                <ChevronRight color="#9CA3AF" size={20} />
              </TouchableOpacity>
              
              {editing && (
                <View style={styles.editFormContainer}>
                  <View style={styles.editField}>
  <Text style={styles.editLabel}>Username</Text>
  <TextInput
    style={styles.editInput}
    value={profile.username}
    onChangeText={(value) => handleChange('username', value)}
    placeholder="Enter your username"
  />
</View>
<View style={styles.editField}>
  <Text style={styles.editLabel}>First Name</Text>
  <TextInput
    style={styles.editInput}
    value={profile.first_name}
    onChangeText={(value) => handleChange('first_name', value)}
    placeholder="Enter your first name"
  />
</View>
<View style={styles.editField}>
  <Text style={styles.editLabel}>Last Name</Text>
  <TextInput
    style={styles.editInput}
    value={profile.last_name}
    onChangeText={(value) => handleChange('last_name', value)}
    placeholder="Enter your last name"
  />
</View>
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Age</Text>
                    <TextInput
                      style={styles.editInput}
                      value={profile.age}
                      onChangeText={(value) => handleChange('age', value)}
                      placeholder="Enter your age"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Height (cm)</Text>
                    <TextInput
                      style={styles.editInput}
                      value={profile.height}
                      onChangeText={(value) => handleChange('height', value)}
                      placeholder="Enter your height"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Weight (kg)</Text>
                    <TextInput
                      style={styles.editInput}
                      value={profile.weight}
                      onChangeText={(value) => handleChange('weight', value)}
                      placeholder="Enter your weight"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.editField}>
  <Text style={styles.editLabel}>Fitness Goal</Text>
  <TouchableOpacity 
    style={styles.dropdownButton}
    onPress={() => setGoalPickerVisible(true)}
  >
    <Text style={[styles.dropdownButtonText, !profile.goal && styles.placeholderText]}>
      {profile.goal || 'Select a fitness goal'}
    </Text>
  </TouchableOpacity>

  {/* Goal Picker Modal */}
  <Modal
    visible={goalPickerVisible}
    animationType="slide"
    transparent={true}
  >
    <View style={styles.modalContainer}>
      <View style={styles.pickerContainer}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Select Goal</Text>
          <TouchableOpacity onPress={() => setGoalPickerVisible(false)}>
            <Text style={styles.pickerDoneButton}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <Picker
          selectedValue={profile.goal}
          onValueChange={handleGoalSelection}
        >
          <Picker.Item label="Look Muscular & Toned" value="Look Muscular & Toned" />
          <Picker.Item label="Get Stronger, Faster" value="Get Stronger, Faster" />
          <Picker.Item label="Lose Fat" value="Lose Fat" />
        </Picker>
      </View>
    </View>
  </Modal>
</View>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveProfile}
                    disabled={loading}
                  >
                    <Text style={styles.saveButtonText}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {renderSettingItem(<ClipboardList size={24} color="#111827" />, "Questionary")}
              {renderSettingItem(<Globe size={24} color="#111827" />, "Password")}
              {renderSettingItem(<Globe size={24} color="#111827" />, "Language", "English")}
              {renderSettingItem(<Bell size={24} color="#111827" />, "Notifications")}
              {renderSettingItem(<Globe size={24} color="#111827" />, "Subscription", "Free")}
              {renderSettingItem(<CreditCard size={24} color="#111827" />, "Payment method", "Credit card")}
              
              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <View style={styles.iconContainer}>
                    <View style={styles.faceIdIcon} />
                  </View>
                  <Text style={styles.settingTitle}>Face ID</Text>
                </View>
                {renderToggle(faceIdEnabled, () => setFaceIdEnabled(!faceIdEnabled))}
              </View>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={signOut}
              >
                <View style={styles.settingItemLeft}>
                  <View style={styles.iconContainer}>
                    <User size={24} color="#DC2626" />
                  </View>
                  <Text style={styles.signOutText}>Sign Out</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Workout Section */}
        {activeTab === 'Workout' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout</Text>
            <View style={styles.sectionContent}>
              {renderSettingItem(
                <View style={styles.iconContainer}><Text style={styles.calculatorIcon}>⚖️</Text></View>,
                "Preferred units",
                "Metric/kg"
              )}
              {renderSettingItem(<View style={styles.iconContainer}><Text>⏱️</Text></View>, "Rest timer", "45 sec")}
              {renderSettingItem(<View style={styles.iconContainer}><Text>📤</Text></View>, "Export workout data")}
            </View>
          </View>
        )}

        {/* More Section */}
        {activeTab === 'More' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>More</Text>
            <View style={styles.sectionContent}>
              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <View style={styles.iconContainer}>
                    <Moon size={24} color="#111827" />
                  </View>
                  <Text style={styles.settingTitle}>Dark mode</Text>
                </View>
                {renderToggle(darkModeEnabled, () => setDarkModeEnabled(!darkModeEnabled))}
              </View>
              {renderSettingItem(<Globe size={24} color="#111827" />, "Integrations")}
              {renderSettingItem(<Star size={24} color="#111827" />, "Rate & review")}
              {renderSettingItem(<Globe size={24} color="#111827" />, "Restore purchase")}
              {renderSettingItem(<Globe size={24} color="#111827" />, "Help & support")}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: '#F3F4F6',
  },
  backButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 16,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F05252',
    top: 3,
    right: -3,
    zIndex: 1,
  },
  messageIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageIconInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#24262F',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headlineContainer: {
    marginBottom: 24,
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 36,
    color: '#111827',
    marginBottom: 0,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#9CA3AF',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: '#FAFBFC',
    borderWidth: 1,
    borderColor: '#FAFBFC',
  },
  activeTabButton: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  tabText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#4B5563',
  },
  activeTabText: {
    color: '#FCFDFD',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: '#111827',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#FAFBFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  settingTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  settingTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#111827',
  },
  settingSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#9CA3AF',
  },
  toggleContainer: {
    width: 56,
    height: 32,
  },
  toggleBackground: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleBackgroundActive: {
    backgroundColor: '#4F46E5',
  },
  toggleButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FCFDFD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleButtonActive: {
    transform: [{ translateX: 24 }],
  },
  faceIdIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calculatorIcon: {
    fontSize: 20,
  },
  editFormContainer: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  editField: {
    marginBottom: 16,
  },
  editLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
  },
  editInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#FFFFFF',
  },
  signOutText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#DC2626',
    marginLeft: 8,
  },
dropdownButton: {
  height: 52,
  backgroundColor: '#ffffff',
  borderWidth: 1,
  borderColor: '#e5e7eb',
  borderRadius: 5,
  paddingHorizontal: 16,
  justifyContent: 'center',
},
dropdownButtonText: {
  fontFamily: fonts.medium,
  fontSize: 16,
  color: '#111827',
},
placeholderText: {
  color: '#9ca3af',
},
modalContainer: {
  flex: 1,
  justifyContent: 'flex-end',
  backgroundColor: 'rgba(0,0,0,0.5)',
},
pickerContainer: {
  backgroundColor: '#ffffff',
  borderTopLeftRadius: 15,
  borderTopRightRadius: 15,
  paddingBottom: 20,
},
pickerHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#e5e7eb',
},
pickerTitle: {
  fontFamily: fonts.semiBold,
  fontSize: 18,
  color: '#111827',
},
pickerDoneButton: {
  fontFamily: fonts.medium,
  fontSize: 16,
  color: '#4F46E5',
},
});