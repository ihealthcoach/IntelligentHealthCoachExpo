import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, SafeAreaView, StatusBar, TextInput } from 'react-native';
import { ArrowLeft, User, ClipboardList, Globe, Bell, CreditCard, Moon, Star, ChevronRight, Plus } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { MainTabScreenProps } from '../../types/navigation';

export default function ProfileScreen({ navigation }: MainTabScreenProps<'Profile'>) {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState({
    username: 'fitnessuser',
    fullName: 'John Doe',
    age: '32',
    height: '180',
    weight: '75',
    fitnessGoal: 'Build muscle and improve overall fitness',
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Account');
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // In a real app, fetch profile from Supabase
      // For now, we'll just use mock data
      setProfile({
        username: 'fitnessuser',
        fullName: 'John Doe',
        age: '32',
        height: '180',
        weight: '75',
        fitnessGoal: 'Build muscle and improve overall fitness',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      // In a real app, save the profile to Supabase
      console.log('Saving profile:', profile);
      
      // End editing mode
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={30} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Bell size={30} color="#24262F" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <View style={styles.notificationDot} />
            <View style={styles.messageIcon}>
              <View style={styles.messageIconInner} />
            </View>
          </TouchableOpacity>
          <Image
            source={{ uri: `https://ui-avatars.com/api/?name=${profile.fullName}&background=random` }}
            style={styles.avatar}
          />
        </View>
      </View>

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
                    <Text style={styles.editLabel}>Name</Text>
                    <TextInput
                      style={styles.editInput}
                      value={profile.fullName}
                      onChangeText={(value) => handleChange('fullName', value)}
                      placeholder="Enter your name"
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
                    <TextInput
                      style={styles.editInput}
                      value={profile.fitnessGoal}
                      onChangeText={(value) => handleChange('fitnessGoal', value)}
                      placeholder="Enter your fitness goal"
                      multiline
                    />
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
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 0,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
  },
  subtitle: {
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
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  activeTabText: {
    color: '#FCFDFD',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingSubtitle: {
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
    fontSize: 14,
    fontWeight: '500',
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
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#DC2626',
    marginLeft: 8,
  },
});