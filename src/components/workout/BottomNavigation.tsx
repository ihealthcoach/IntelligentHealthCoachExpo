import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Info, Activity, Timer, FileText } from 'lucide-react-native';
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

interface BottomNavigationProps {
  onNotesPress: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onNotesPress
}) => {
  return (
    <View style={styles.bottomNavContainer}>
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Info size={24} color="#FCFDFD" />
          <Text style={styles.navText}>Guide</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Activity size={24} color="#FCFDFD" />
          <Text style={styles.navText}>Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Timer size={24} color="#FCFDFD" />
          <Text style={styles.navText}>Timer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={onNotesPress}
        >
          <FileText size={24} color="#FCFDFD" />
          <Text style={styles.navText}>Notes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.gray[900],
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 16,
  },
  navItem: {
    alignItems: 'center',
    width: 60,
    gap: 6,
  },
  navText: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: '#FCFDFD',
    textAlign: 'center',
  },
});

export default BottomNavigation;