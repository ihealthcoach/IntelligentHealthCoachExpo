import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated 
} from 'react-native';
import { Award, Trash, Check } from 'lucide-react-native';
import { ExerciseSet } from '../../types/workout';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

interface SetRowProps {
  set: ExerciseSet;
  index: number;
  isActive: boolean;
  isInactive: boolean;
  isLastCompleted: boolean;
  isSelected: boolean;
  completeAnimation?: Animated.Value;
  onSetPress: (set: ExerciseSet) => void;
  onToggleCompletion: (setId: string) => void;
  onRemove: (setId: string) => void;
}

const SetRow: React.FC<SetRowProps> = ({
  set,
  index,
  isActive,
  isInactive,
  isLastCompleted,
  isSelected,
  completeAnimation = new Animated.Value(0),
  onSetPress,
  onToggleCompletion,
  onRemove
}) => {
  const handlePressSet = () => {
    // Only allow pressing incomplete sets that aren't inactive
    if (!set.isComplete && !isInactive) {
      onSetPress(set);
    }
  };

  return (
    <Animated.View 
      style={[
        styles.setRow, 
        isActive && styles.activeSetRow,
        isInactive && styles.inactiveSetRow,
        isSelected && styles.selectedSetRow,
        isLastCompleted && {
          backgroundColor: completeAnimation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: ['#FCFDFD', '#E0F2FE', '#FCFDFD']
          })
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.setRowContent}
        onPress={handlePressSet}
        disabled={set.isComplete || isInactive}
      >
        {/* Set number */}
        <View style={styles.setNumberContainer}>
          <Text style={[styles.setNumber, isInactive && styles.inactiveText]}>
            {String(set.setNumber).padStart(2, '0')}
          </Text>
        </View>
        
        {/* Previous performance */}
        <View style={styles.previousContainer}>
          {set.previousWeight && set.previousReps ? (
            <Text style={[styles.previousText, isInactive && styles.inactiveText]}>
              {set.previousWeight}kg × {set.previousReps}
            </Text>
          ) : (
            <Text style={[styles.previousText, styles.emptyValue, isInactive && styles.inactiveText]}>
              -
            </Text>
          )}
        </View>
        
        {/* Weight */}
        <View style={styles.weightContainer}>
          <Text style={[
            styles.weightValue, 
            !set.weight && styles.emptyValue,
            isInactive && styles.inactiveText,
            (set.weight && !set.isComplete) && styles.savedButNotCompletedText
          ]}>
            {set.weight?.toString() || '-'}
          </Text>
        </View>
        
        {/* Reps */}
        <View style={styles.repsContainer}>
          <Text style={[
            styles.repsValue, 
            !set.reps && styles.emptyValue,
            isInactive && styles.inactiveText
          ]}>
            {set.reps?.toString() || '-'}
          </Text>
        </View>
        
        {/* RPE (Rate of Perceived Exertion) */}
        <View style={styles.rpeContainer}>
          <Text style={[
            styles.rpeValue, 
            !set.rpe && styles.emptyValue,
            isInactive && styles.inactiveText,
            !set.isComplete && styles.disabledText
          ]}>
            {set.rpe?.toString() || '-'}
          </Text>
        </View>
        
        {/* Completion checkbox / PR indicator */}
        <View style={styles.completionContainer}>
          {set.isPR ? (
            <View style={styles.prContainer}>
              <Award size={20} color="#F59E0B" />
            </View>
          ) : set.isComplete ? (
            <TouchableOpacity 
              style={styles.completedIndicator}
              onPress={() => onToggleCompletion(set.id)}
              disabled={isInactive}
            >
              <Check size={16} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.incompleteIndicator}
              onPress={() => onToggleCompletion(set.id)}
              disabled={isInactive}
            />
          )}
          
          {/* Set menu button for additional actions */}
          <TouchableOpacity 
            style={styles.setMenuButton}
            onPress={() => onRemove(set.id)}
          >
            <Trash size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  setRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activeSetRow: {
    backgroundColor: colors.gray[50],
  },
  inactiveSetRow: {
    backgroundColor: 'transparent',
    opacity: 0.7,
  },
  selectedSetRow: {
    backgroundColor: colors.indigo[50],
    borderWidth: 1,
    borderColor: colors.indigo[200],
  },
  setRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
  },
  setNumberContainer: {
    width: 30,
    alignItems: 'center',
  },
  setNumber: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.gray[900],
  },
  previousContainer: {
    width: 60,
    alignItems: 'center',
  },
  previousText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  weightContainer: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightValue: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.gray[900],
    textAlign: 'center',
  },
  repsContainer: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repsValue: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.gray[900],
    textAlign: 'center',
  },
  rpeContainer: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rpeValue: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.gray[900],
    textAlign: 'center',
  },
  completionContainer: {
    width: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.indigo[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  incompleteIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  setMenuButton: {
    padding: 4,
  },
  emptyValue: {
    color: '#9CA3AF',
  },
  inactiveText: {
    color: colors.gray[300],
  },
  disabledText: {
    color: colors.gray[300],
  },
  prContainer: {
    marginRight: 4,
  },
  savedButNotCompletedText: {
    color: '#4F46E5',
    fontStyle: 'normal',
  },
});

export default SetRow;