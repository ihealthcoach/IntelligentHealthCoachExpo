import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

interface CompletionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onCompleteWorkout: () => void;
  onContinueWorkout: () => void;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
  visible,
  onDismiss,
  onCompleteWorkout,
  onContinueWorkout
}) => {
  return (
    <View style={styles.completionModal}>
      <Text style={styles.completionTitle}>Workout Complete</Text>
      <Text style={styles.completionSubtitle}>
        You've reached the end of your workout. What would you like to do?
      </Text>
      
      <View style={styles.completionButtons}>
        <Button
          mode="contained"
          style={styles.completeButton}
          onPress={onCompleteWorkout}
        >
          Complete Workout
        </Button>
        
        <Button
          mode="outlined"
          style={styles.continueButton}
          onPress={onContinueWorkout}
        >
          Continue Workout
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  completionModal: {
    backgroundColor: colors.common.white,
    padding: 20,
    marginHorizontal: 30,
    borderRadius: 12,
  },
  completionTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.gray[900],
    marginBottom: 12,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  completionButtons: {
    gap: 12,
  },
  completeButton: {
    backgroundColor: colors.indigo[600],
    paddingVertical: 8,
  },
  continueButton: {
    borderColor: '#6B7280',
  },
});

export default CompletionModal;