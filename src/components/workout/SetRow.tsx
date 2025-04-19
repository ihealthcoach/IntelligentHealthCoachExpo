import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Animated
} from 'react-native';
import {
  Check,
  Trash,
  Award
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { ExerciseSet } from '../../types/workout';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

// Components
import Icon from '../Icons';
import { IconName } from '../Icons';

interface SetRowProps {
  set: ExerciseSet;
  index: number;
  isActive: boolean;
  isInactive: boolean;
  isLastCompleted: boolean;
  setCompleteAnimation: Animated.Value;
  editingWeight: {setId: string, value: string} | null;
  editingReps: {setId: string, value: string} | null;
  editingRPE: {setId: string, value: number | null} | null;
  setEditingWeight: (value: {setId: string, value: string} | null) => void;
  setEditingReps: (value: {setId: string, value: string} | null) => void;
  setEditingRPE: (value: {setId: string, value: number | null} | null) => void;
  updateSetValue: (setId: string, field: 'weight' | 'reps' | 'rpe', value: string | number) => void;
  toggleSetCompletion: (setId: string) => void;
  removeSet: (setId: string) => void;
}

const SetRow: React.FC<SetRowProps> = ({
  set,
  index,
  isActive,
  isInactive,
  isLastCompleted,
  setCompleteAnimation,
  editingWeight,
  editingReps,
  editingRPE,
  setEditingWeight,
  setEditingReps,
  setEditingRPE,
  updateSetValue,
  toggleSetCompletion,
  removeSet
}) => {
  return (
    <Animated.View 
      key={set.id} 
      style={[
        styles.setRow, 
        isActive && styles.activeSetRow,
        isInactive && styles.inactiveSetRow,
        isLastCompleted && {
          backgroundColor: setCompleteAnimation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: ['#FCFDFD', '#E0F2FE', '#FCFDFD']
          })
        }
      ]}
    >
      <View style={styles.setRowContent}>
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
          {editingWeight && editingWeight.setId === set.id ? (
            <TextInput
              style={styles.valueInput}
              value={editingWeight.value}
              onChangeText={(text) => setEditingWeight({...editingWeight, value: text})}
              keyboardType="numeric"
              autoFocus
              onBlur={() => {
                updateSetValue(set.id, 'weight', editingWeight.value);
                setEditingWeight(null);
              }}
              onSubmitEditing={() => {
                updateSetValue(set.id, 'weight', editingWeight.value);
                setEditingWeight(null);
              }}
            />
          ) : (
            <TouchableOpacity
              onPress={() => setEditingWeight({setId: set.id, value: set.weight?.toString() || ''})}
              disabled={isInactive}
            >
              <Text style={[
                styles.weightValue, 
                !set.weight && styles.emptyValue,
                isInactive && styles.inactiveText,
                (set.weight && !set.isComplete) && styles.savedButNotCompletedText
              ]}>
                {set.weight?.toString() || '-'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Reps */}
        <View style={styles.repsContainer}>
          {editingReps && editingReps.setId === set.id ? (
            <TextInput
              style={styles.valueInput}
              value={editingReps.value}
              onChangeText={(text) => setEditingReps({...editingReps, value: text})}
              keyboardType="numeric"
              autoFocus
              onBlur={() => {
                updateSetValue(set.id, 'reps', editingReps.value);
                setEditingReps(null);
              }}
              onSubmitEditing={() => {
                updateSetValue(set.id, 'reps', editingReps.value);
                setEditingReps(null);
              }}
            />
          ) : (
            <TouchableOpacity
              onPress={() => setEditingReps({setId: set.id, value: set.reps?.toString() || ''})}
              disabled={isInactive}
            >
              <Text style={[
                styles.repsValue, 
                !set.reps && styles.emptyValue,
                isInactive && styles.inactiveText
              ]}>
                {set.reps?.toString() || '-'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* RPE (Rate of Perceived Exertion) */}
        <View style={styles.rpeContainer}>
          {editingRPE && editingRPE.setId === set.id ? (
            <Slider
              style={styles.rpeSlider}
              value={editingRPE.value || 5}
              minimumValue={1}
              maximumValue={10}
              step={0.5}
              minimumTrackTintColor="#4F46E5"
              maximumTrackTintColor="#E5E7EB"
              onValueChange={(value) => setEditingRPE({...editingRPE, value})}
              onSlidingComplete={(value) => {
                updateSetValue(set.id, 'rpe', value);
                setEditingRPE(null);
              }}
            />
          ) : (
            <TouchableOpacity
              onPress={() => setEditingRPE({setId: set.id, value: set.rpe})}
              disabled={isInactive || !set.isComplete}
            >
              <Text style={[
                styles.rpeValue, 
                !set.rpe && styles.emptyValue,
                isInactive && styles.inactiveText,
                !set.isComplete && styles.disabledText
              ]}>
                {set.rpe?.toString() || '-'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Completion checkbox / PR indicator */}
        <View style={styles.completionContainer}>
          {set.isPR ? (
            <View style={styles.prContainer}>
              <Award size={20} color="#F59E0B" />
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => toggleSetCompletion(set.id)}
              disabled={isInactive}
              style={[
                styles.completionCheckbox,
                set.isComplete && styles.completedCheckbox,
                isInactive && styles.disabledCheckbox
              ]}
            >
              {set.isComplete && (
                <Icon name="check-mini" width={16} height={16} color={colors.common.white} />
              )}
            </TouchableOpacity>
          )}
          
          {/* Set menu button for additional actions */}
          <TouchableOpacity 
            style={styles.setMenuButton}
            onPress={() => removeSet(set.id)}
          >
            <Icon name="trash-outline" width={16} height={16} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>
      </View>
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
  rpeSlider: {
    width: 100,
    height: 40,
    position: 'absolute',
    right: -30,
  },
  valueInput: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.gray[900],
    textAlign: 'center',
    width: 45,
    padding: 0,
  },
  completionContainer: {
    width: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCheckbox: {
    backgroundColor: colors.indigo[600],
    borderColor: '#4F46E5',
  },
  disabledCheckbox: {
    borderColor: '#D1D5DB',
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