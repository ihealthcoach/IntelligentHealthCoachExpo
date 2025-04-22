import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, MoreHorizontal } from 'lucide-react-native';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

interface WorkoutHeaderProps {
  currentExerciseIndex: number;
  totalExercises: number;
  onBackPress: () => void;
  onMenuPress?: () => void;
}

const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({
  currentExerciseIndex,
  totalExercises,
  onBackPress,
  onMenuPress
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={onBackPress}>
          <ArrowLeft size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.headerText}>Exercise</Text>
          <Text style={styles.headerCount}>
            {currentExerciseIndex + 1} of {totalExercises}
          </Text>
        </View>
        
        <TouchableOpacity onPress={onMenuPress}>
          <MoreHorizontal size={24} color={colors.gray[900]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    borderBottomWidth: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#9CA3AF',
  },
  headerCount: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.gray[900],
  },
});

export default WorkoutHeader;