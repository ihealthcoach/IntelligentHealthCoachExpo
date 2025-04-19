import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Edit, Save } from 'lucide-react-native';
import { WorkoutExercise, SupersetType } from '../../types/workout';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

// Components
import Icon from '../Icons';
import { IconName } from '../Icons';

interface ExerciseHeaderProps {
  exercise: WorkoutExercise;
  getCompletedSetsText: () => string;
  isEditingNotes: boolean;
  exerciseNotes: string;
  setExerciseNotes: (notes: string) => void;
  setIsEditingNotes: (editing: boolean) => void;
  updateExerciseNotes: () => Promise<void>;
}

const ExerciseHeader: React.FC<ExerciseHeaderProps> = ({
  exercise,
  getCompletedSetsText,
  isEditingNotes,
  exerciseNotes,
  setExerciseNotes,
  setIsEditingNotes,
  updateExerciseNotes
}) => {
  return (
    <View style={styles.titleSection}>
      <View style={styles.headlineContainer}>
        <Text style={styles.headline}>{exercise.name}</Text>
        <View style={styles.subtitleSection}>
          <Text style={styles.subtitle}>{getCompletedSetsText()}</Text>
          {exercise.supersetType && exercise.supersetType !== SupersetType.NONE && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{exercise.supersetType}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Notes section */}
      <View style={styles.noteContainer}>
        {isEditingNotes ? (
          <View style={styles.noteEditContainer}>
            <TextInput
              style={styles.noteEditInput}
              value={exerciseNotes}
              onChangeText={setExerciseNotes}
              placeholder="Add notes for this exercise..."
              multiline
              autoFocus
            />
            <TouchableOpacity style={styles.noteSaveButton} onPress={updateExerciseNotes}>
              <Save size={18} color="#4F46E5" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.noteDisplayContainer}
            onPress={() => setIsEditingNotes(true)}
          >
            <Text style={styles.noteText}>
              {exerciseNotes || "Tap to add notes..."}
            </Text>
            <Edit size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  titleSection: {
    paddingHorizontal: 16,
    paddingBottom: 0,
    marginBottom: 16,
  },
  headlineContainer: {
    marginBottom: 8,
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 36,
    color: colors.gray[900],
    marginBottom: 0,
  },
  subtitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 26,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#9CA3AF',
  },
  badge: {
    backgroundColor: colors.gray[900],
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FCFDFD',
    fontFamily: fonts.medium,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  noteContainer: {
    minHeight: 32,
    justifyContent: 'center',
    marginTop: 8,
  },
  noteDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  noteEditContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  noteEditInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.gray[900],
  },
  noteSaveButton: {
    padding: 16,
  },
  noteText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
  },
});

export default ExerciseHeader;