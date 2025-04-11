import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, BarChart3, Plus, ChefHat, Dumbbell } from 'lucide-react-native';

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.bottomNav}>
      <View style={styles.navContent}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Home width={24} height={24} color="#111827" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('History')}
        >
          <BarChart3 width={24} height={24} color="#111827" />
          <Text style={styles.navText}>Activity</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('Workouts')}
        >
          <Plus width={24} height={24} color="#FCFDFD" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Exercises')}
        >
          <ChefHat width={24} height={24} color="#111827" />
          <Text style={styles.navText}>Food</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Workouts')}
        >
          <Dumbbell width={24} height={24} color="#111827" />
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
    fontSize: 11,
    fontWeight: '500',
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