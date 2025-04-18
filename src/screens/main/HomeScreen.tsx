import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView, 
  StatusBar
} from 'react-native';
import { supabase } from '../../services/supabase';
import { Snackbar, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Components
import Header from '../../components/Header';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { useAuth } from '../../contexts/AuthContext';
import { MainTabScreenProps } from '../../types/navigation';

// Icons
import FireMini from '../../assets/icons/fire-mini.svg';
import ClockOutline from '../../assets/icons/clock-outline.svg';
import StepsIcon from '../../assets/icons/steps.svg';
import MapPinOutline from '../../assets/icons/map-pin-outline.svg';
import DumbbellIcon from '../../assets/icons/dumbbell.svg';
import ArrowRightMini from '../../assets/icons/arrow-right-mini.svg';
import ChevronRightMini from '../../assets/icons/chevron-right-mini.svg';
import ChevronDownMini from '../../assets/icons/chevron-down-mini.svg';
import PlusMini from '../../assets/icons/plus-mini.svg';

// Fonts
import { fonts } from '../../styles/fonts';

// Colors
import { colors } from '../../styles/colors';

export default function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { user, signOut } = useAuth();
  const [greeting, setGreeting] = useState<string>('Good morning');
  const [emoji, setEmoji] = useState<string>('🍳');
  const { showSnackbar, hideSnackbar, visible, message, action } = useSnackbar();

  useFocusEffect(
    React.useCallback(() => {
      const checkCompletedWorkout = async () => {
        try {
          const completedWorkout = await AsyncStorage.getItem('recently_completed_workout');
          
          if (completedWorkout) {
            // Show snackbar
            showSnackbar('Workout saved', {
              label: 'View workout',
              onPress: () => {
                // Navigate to workout history
                navigation.navigate('History');
                hideSnackbar();
              }
            });
            
            // Remove the flag so it doesn't show again
            await AsyncStorage.removeItem('recently_completed_workout');
            
            // Auto-hide after 4 seconds
            setTimeout(() => {
              hideSnackbar();
            }, 4000);
          }
        } catch (error) {
          console.error('Error checking for completed workout:', error);
        }
      };
      
      checkCompletedWorkout();
    }, [])
  );

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    
    if (hour >= 0 && hour < 12) {
      setGreeting('Good morning');
      setEmoji('🍳');
    } else if (hour >= 12 && hour < 17) {
      setGreeting('Good afternoon');
      setEmoji('😊');
    } else {
      setGreeting('Good evening');
      setEmoji('💪🏻');
    }
  }, []);

// Add this state
const [profile, setProfile] = useState<{ first_name: string | null; avatar_url: string | null }>({
  first_name: null,
  avatar_url: null
});

// Add this useEffect
useEffect(() => {
  const fetchProfile = async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, avatar_url')
          .eq('user_id', user.id)
          .single();
          
        if (data && !error) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }
  };
  
  fetchProfile();
}, [user]);

// Replace with this improved function
const getFirstName = () => {
  if (profile?.first_name) {
    return profile.first_name;
  }
  
  // Fallback to email if no profile name exists
  if (user?.email) {
    return user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1);
  }
  
  return 'User';
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Background Gradient */}
      <View style={styles.backgroundGradient} />
      
      <Header 
  profile={profile}
  getFirstName={getFirstName}
  showMenu={true}
  goBack={false}
/>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.mainContent}>
          {/* Greeting Section */}
          <View style={styles.greetingSection}>
            <View style={styles.greetingHeader}>
              <View>
                <Text style={styles.greetingText}>{greeting} {emoji}</Text>
                <Text style={styles.nameText}>{getFirstName()}</Text>
              </View>
              
              <View style={styles.badgesContainer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Muscle building</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>3 meals</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>12 weeks</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Omnivore</Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.subText}>
              Great start of the day, a little more to reach today's goals
            </Text>
          </View>
          
          {/* Today's Goals Section */}
          <View style={styles.goalsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Today's goals</Text>
                <ChevronDownMini width={20} height={20} fill={colors.gray[900]} />
              </View>
              
              <TouchableOpacity style={styles.editLink}>
                <Text style={styles.editLinkText}>Edit goals</Text>
                <ArrowRightMini width={14} height={14} fill={colors.gray[900]} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.goalsCard}>
              {/* Calories and Active Time Row */}
              <View style={styles.goalsRow}>
                {/* Calories */}
                <View style={styles.goalItem}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalIconContainer}>
                      <FireMini width={24} height={24} fill={colors.gray[500]} />
                    </View>
                    <Text style={styles.goalTitle}>Calories</Text>
                  </View>
                  
                  <View style={styles.goalValueContainer}>
                    <Text style={styles.goalValue}>1.510</Text>
                    <Text style={styles.goalUnit}>kcal</Text>
                  </View>
                  
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBg} />
                    <View style={[styles.progressBar, { width: '70%' }]} />
                  </View>
                  
                  <Text style={styles.goalTarget}>/2.500 kcal</Text>
                </View>
                
                {/* Active Time */}
                <View style={styles.goalItem}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalIconContainer}>
                      <ClockOutline width={24} height={24} stroke={colors.gray[900]} />
                    </View>
                    <Text style={styles.goalTitle}>Active time</Text>
                  </View>
                  
                  <View style={styles.goalValueContainer}>
                    <Text style={styles.goalValue}>60</Text>
                    <Text style={styles.goalUnit}>min.</Text>
                  </View>
                  
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBg} />
                    <View style={[styles.progressBar, { width: '50%' }]} />
                  </View>
                  
                  <Text style={styles.goalTarget}>/120 min</Text>
                </View>
              </View>
              
              {/* Steps and Distance Row */}
              <View style={styles.goalsRow}>
                {/* Steps */}
                <View style={styles.goalItem}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalIconContainer}>
                      <StepsIcon width={24} height={24} color={colors.gray[900]} />
                    </View>
                    <Text style={styles.goalTitle}>Steps</Text>
                  </View>
                  
                  <View style={styles.goalValueContainer}>
                    <Text style={styles.goalValue}>3.500</Text>
                    <Text style={styles.goalUnit}>steps</Text>
                  </View>
                  
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBg} />
                    <View style={[styles.progressBar, { width: '35%' }]} />
                  </View>
                  
                  <Text style={styles.goalTarget}>/10.000</Text>
                </View>
                
                {/* Distance */}
                <View style={styles.goalItem}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalIconContainer}>
                      <MapPinOutline width={24} height={24} stroke={colors.gray[900]} />
                    </View>
                    <Text style={styles.goalTitle}>Distance</Text>
                  </View>
                  
                  <View style={styles.goalValueContainer}>
                    <Text style={styles.goalValue}>9.4</Text>
                    <Text style={styles.goalUnit}>km</Text>
                  </View>
                  
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBg} />
                    <View style={[styles.progressBar, { width: '90%' }]} />
                  </View>
                  
                  <Text style={styles.goalTarget}>/10.00 km</Text>
                </View>
              </View>
              
              {/* Workouts Row */}
              <TouchableOpacity 
                style={styles.statsRow}
                onPress={() => navigation.navigate('Workouts')}
              >
                <View style={styles.statsTextContainer}>
                  <Text style={styles.statsTitle}>Workouts (week 36)</Text>
                  <Text style={styles.statsValue}>3/5</Text>
                </View>
                <ChevronRightMini width={20} height={20} stroke={colors.gray[400]} />
              </TouchableOpacity>
              
              {/* Weight Row */}
              <TouchableOpacity 
                style={styles.statsRow}
                onPress={() => navigation.navigate('Profile')}
              >
                <View style={styles.statsTextContainer}>
                  <Text style={styles.statsTitle}>Weight</Text>
                  <Text style={styles.statsValue}>86/92 kg</Text>
                </View>
                <ChevronRightMini width={20} height={20} stroke={colors.gray[400]} />
              </TouchableOpacity>
              
              {/* Calories Row */}
              <TouchableOpacity style={styles.statsRow}>
                <View style={styles.statsTextContainer}>
                  <Text style={styles.statsTitle}>Calories</Text>
                  <Text style={styles.statsValue}>1.350/2.500</Text>
                </View>
                <ChevronRightMini width={20} height={20} stroke={colors.gray[400]} />
              </TouchableOpacity>
            </View>
            
            {/* Track Workout Button */}
            <TouchableOpacity 
              style={styles.trackButton}
              onPress={() => navigation.navigate('Workouts')}
            >
              <Text style={styles.trackButtonText}>Track a workout</Text>
              <ArrowRightMini width={24} height={24} fill={colors.common.white}/>
            </TouchableOpacity>
          </View>
          
          {/* Today's Activities Section */}
          <View style={styles.activitiesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's activities</Text>
              
              <TouchableOpacity 
                style={styles.editLink}
                onPress={() => navigation.navigate('History')}
              >
                <Text style={styles.editLinkText}>Show history</Text>
                <ArrowRightMini width={14} height={14} fill={colors.gray[900]} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.activitiesCard}>
              {/* Running Activity */}
              <View style={styles.activityItem}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityTitle}>Running</Text>
                  <ArrowRightMini width={20} height={20} fill={colors.gray[900]} />
                </View>
                
                <View style={styles.activityStats}>
                  <View style={styles.activityStat}>
                    <ClockOutline width={24} height={24} stroke={colors.gray[500]} />
                    <Text style={styles.activityStatValue}>00:40:17</Text>
                  </View>
                  
                  <View style={styles.activityStat}>
                    <FireMini width={24} height={24} fill={colors.gray[500]} />
                    <Text style={styles.activityStatValue}>140 kcal</Text>
                  </View>
                  
                  <View style={styles.activityStat}>
                    <MapPinOutline width={24} height={24} stroke={colors.gray[500]} />
                    <Text style={styles.activityStatValue}>4,2 km</Text>
                  </View>
                </View>
              </View>
              
              {/* Gym Activity */}
              <View style={styles.activityItem}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityTitle}>Gym</Text>
                  <ArrowRightMini width={20} height={20} fill={colors.gray[900]} />
                </View>
                
                <View style={styles.activityStats}>
                  <View style={styles.activityStat}>
                    <ClockOutline width={24} height={24} stroke={colors.gray[900]} />
                    <Text style={styles.activityStatValue}>01:15:00</Text>
                  </View>
                  
                  <View style={styles.activityStat}>
                    <FireMini width={24} height={24} fill={colors.gray[900]} />
                    <Text style={styles.activityStatValue}>812 kcal</Text>
                  </View>
                  
                  <View style={styles.activityStat}>
                    <DumbbellIcon width={24} height={24} fill={colors.gray[500]} />
                    <Text style={styles.activityStatValue}>8 exercises</Text>
                  </View>
                  
                  <View style={styles.activityStat}>
                    <DumbbellIcon width={24} height={24} fill={colors.gray[500]} />
                    <Text style={styles.activityStatValue}>00:15</Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Add Widget Button */}
            <TouchableOpacity 
              style={styles.addWidgetButton}
              onPress={() => navigation.navigate('Exercises')}
            >
              <View style={styles.addWidgetContent}>
                <PlusMini width={20} height={20} stroke={colors.gray[400]} />
                <Text style={styles.addWidgetText}>add widget</Text>
              </View>
            </TouchableOpacity>

            {/* Hidden Sign Out Button (preserved functionality from original HomeScreen) */}
            <TouchableOpacity 
              style={[styles.signOutButton, { display: 'none' }]}
              onPress={signOut}
            >
              <Text>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Developer Tools Section */}
        <View style={styles.devToolsContainer}>
  <TouchableOpacity 
    style={styles.devToolButton}
    onPress={() => navigation.navigate('GifChecker')}
  >
    <Text style={styles.devToolButtonText}>Check GIF References</Text>
  </TouchableOpacity>
</View>

      </ScrollView>
      <Snackbar
      visible={visible}
      onDismiss={hideSnackbar}
      duration={4000}
      action={{
        label: action?.label || 'Dismiss',
        onPress: action?.onPress || hideSnackbar,
      }}
      style={styles.snackbar}
      wrapperStyle={styles.snackbarWrapper}
    >
      <View style={styles.snackbarContent}>
        <Text style={styles.snackbarText}>{message}</Text>
        <IconButton
          icon="close"
          size={20}
          onPress={hideSnackbar}
          style={styles.snackbarCloseIcon}
          iconColor="#FFFFFF"
        />
      </View>
    </Snackbar>
    </SafeAreaView>
  );
}

const ChevronRight = ({ width, height, color }) => {
  return (
    <View style={{ width, height, transform: [{ rotate: '90deg' }] }}>
      <ChevronDownMini width={width} height={height} fill={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  backgroundGradient: {
    position: 'absolute',
    width: '100%',
    height: 844,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 24,
    height: 72,
  },
  menuButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
  },
  menuIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  menuLine: {
    height: 2,
    backgroundColor: colors.gray[900],
    borderRadius: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red[500],
  },
  messageIcon: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red[500],
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  mainContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 48,
  },
  greetingSection: {
    gap: 24,
  },
  greetingHeader: {
    gap: 12,
  },
  greetingText: {
    fontFamily: fonts.light,
    fontSize: 30,
    color: colors.gray[900],
  },
  nameText: {
    fontFamily: fonts.bold,
    fontSize: 30,
    color: colors.gray[900],
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[900],
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.gray[900],
  },
  subText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.gray[900],
    lineHeight: 18,
  },
  goalsSection: {
    gap: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.gray[900],
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  editLinkText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.gray[900],
  },
  goalsCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  goalsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  goalItem: {
    flex: 1,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
  },
  goalHeader: {
    marginBottom: 4,
  },
  goalIconContainer: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  stepsIcon: {
    width: 24,
    height: 24,
    backgroundColor: colors.gray[500],
    borderRadius: 12,
  },
  goalTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.gray[900],
  },
  goalValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 8,
  },
  goalValue: {
    fontFamily: fonts.bold,
    fontSize: 30,
    color: colors.gray[900],
  },
  goalUnit: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.gray[900],
    marginBottom: 8,
    marginLeft: 4,
  },
  progressBarContainer: {
    height: 4,
    borderRadius: 2,
    marginBottom: 6,
  },
  progressBarBg: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray[900],
    borderRadius: 2,
  },
  goalTarget: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 12,
  },
  statsTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.gray[900],
  },
  statsValue: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.gray[900],
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[900],
    borderRadius: 5,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 12,
  },
  trackButtonText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#FCFEFE',
  },
  activitiesSection: {
    gap: 12,
  },
  activitiesCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.gray[900],
  },
  activityStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  activityStat: {
    width: '33%',
    marginTop: 8,
  },
  activityStatValue: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.gray[900],
    marginTop: 6,
  },
  addWidgetButton: {
    height: 90,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addWidgetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addWidgetText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#9CA3AF',
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: colors.gray[900],
    borderRadius: 100,
    alignSelf: 'center',
    marginTop: 12,
  },
  signOutButton: {
    marginTop: 20,
    backgroundColor: colors.gray[100],
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },

  devToolsContainer: {
    marginTop: 24,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  devToolButton: {
    backgroundColor: colors.gray[100],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  devToolButtonText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#4B5563',
  },
  snackbarWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  snackbar: {
    backgroundColor: colors.gray[900],
  },
  snackbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snackbarText: {
    fontFamily: fonts.medium,
    color: '#FCFEFE',
    fontSize: 14,
  },
  snackbarCloseIcon: {
    margin: 0,
  },
});