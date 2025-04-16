import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {BlurView} from '@react-native-community/blur';

// Fonts
import { fonts } from '../styles/fonts';

// Icons
import HomeOutline from '../assets/icons/home-outline.svg';
import ChartBarOutline from '../assets/icons/chart-bar-outline.svg';
import ChefsHatIcon from '../assets/icons/chefs-hat.svg';
import DumbbellIcon from '../assets/icons/dumbbell.svg';
import PlusMini from '../assets/icons/plus-mini.svg';

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.bottomNav}>
      <View style={styles.navContent}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <HomeOutline width={24} height={24} stroke="#111827" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('History')}
        >
          <ChartBarOutline width={24} height={24} stroke="#111827" />
          <Text style={styles.navText}>Activity</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('Workouts')}
        >
          <PlusMini width={24} height={24} fill="#FCFEFE" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Exercises')}
        >
          <ChefsHatIcon width={24} height={24} fill="#111827" />
          <Text style={styles.navText}>Food</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Workouts')}
        >
          <DumbbellIcon width={24} height={24} fill="#111827" />
          <Text style={styles.navText}>Workouts</Text>
        </TouchableOpacity>
      </View>
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

export default CustomTabBar;