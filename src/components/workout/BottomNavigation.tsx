import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Info, Activity, Timer, FileText } from 'lucide-react-native';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

// Components
import Icon from '../Icons';
import { IconName } from '../Icons';

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
        <Icon name="information-circle-outline" width={24} height={24} color={colors.common.white} />
          <Text style={styles.navText}>Guide</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
        <Icon name="activity-outline" width={24} height={24} color={colors.common.white} />
          <Text style={styles.navText}>Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
        <Icon name="chart-bar-outline" width={24} height={24} color={colors.common.white} />
          <Text style={styles.navText}>Timer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={onNotesPress}
        >
          <Icon name="note-add-outline" width={24} height={24} color={colors.common.white} />
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