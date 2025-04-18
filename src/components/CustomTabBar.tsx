import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {BlurView} from '@react-native-community/blur';
import * as Haptics from 'expo-haptics';

// Fonts
import { fonts } from '../styles/fonts';

// Colors
import { colors } from '../styles/colors';

// Components
import ShortcutSheet from './ShortcutSheet';

// Icons
import Icon from './Icons';
import ChartBarOutline from '../assets/icons/chart-bar-outline.svg';
import ChefsHatIcon from '../assets/icons/chefs-hat.svg';
import DumbbellIcon from '../assets/icons/dumbbell.svg';
import PlusMini from '../assets/icons/plus-mini.svg';

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const [showShortcutSheet, setShowShortcutSheet] = useState(false);

  const handleOpenShortcutSheet = () => {
    // Provide haptic feedback when opening sheet
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowShortcutSheet(true);
  };

  const handleCloseShortcutSheet = () => {
    setShowShortcutSheet(false);
  };

  const handleStartWorkout = () => {
    navigation.navigate('WorkoutOverviewScreen');
  };

  return (
    <View style={styles.bottomNav}>
      <View style={styles.navContent}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Icon name="home-outline" width={24} height={24} color={colors.gray[900]} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('History')}
        >
          <Icon name="chart-bar-outline" width={24} height={24} color={colors.gray[900]} fill="none" />
          <Text style={styles.navText}>Activity</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleOpenShortcutSheet}
          activeOpacity={0.8}
        >
          <Icon name="plus-mini" width={24} height={24} fill={colors.common.white} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Workouts')}
        >
          <Icon name="chefs-hat" width={24} height={24} fill={colors.gray[900]} stroke="none" />
          <Text style={styles.navText}>Food</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Exercises')}
        >
          <DumbbellIcon width={24} height={24} fill={colors.gray[900]} />
          <Text style={styles.navText}>Workouts</Text>
        </TouchableOpacity>
      </View>
      
      {/* ShortcutSheet */}
      <ShortcutSheet 
        visible={showShortcutSheet}
        onClose={handleCloseShortcutSheet}
        onStartWorkout={handleStartWorkout}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    height: 60,
    backgroundColor: 'rgba(252, 253, 253, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: 90,
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
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.gray[900],
    marginTop: 2,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.indigo[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomTabBar;