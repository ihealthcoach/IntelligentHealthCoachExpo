import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {BlurView} from '@react-native-community/blur';

// Fonts
import { fonts } from '../styles/fonts';

// Colors
import { colors } from '../styles/colors';

// Icons
import Icon from './Icons';
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
          <Icon name="home-outline" width={24} height={24} color="colors.gray[100]" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('History')}
        >
          <Icon name="chart-bar-outline" width={24} height={24} color="colors.gray[100]" fill="none" />
          <Text style={styles.navText}>Activity</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('Workouts')}
        >
          <Icon name="plus-mini" width={24} height={24} fill="#FCFEFE" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Exercises')}
        >
          <Icon name="chefs-hat" width={24} height={24} fill="#111827" stroke="none" />
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
    color: colors.gray[900],
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