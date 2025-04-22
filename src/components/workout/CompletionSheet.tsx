import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Portal, Modal } from 'react-native-paper';
import { Plus, Edit, ChevronRight } from 'lucide-react-native';

// Assets
import ChevronRightMini from '../../assets/icons/chevron-right-mini.svg';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

interface CompletionSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onAddMoreSets: () => void;
  onGoToNextExercise: () => void;
  onContinueEditing: () => void;
  onAddExercise: () => void;
}

const CompletionSheet: React.FC<CompletionSheetProps> = ({
  visible,
  onDismiss,
  onAddMoreSets,
  onGoToNextExercise,
  onContinueEditing,
  onAddExercise
}) => {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Exercise Complete!</Text>
          <Text style={styles.subtitle}>All sets for this exercise are completed</Text>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.button} onPress={onAddMoreSets}>
              <Plus size={18} color={colors.gray[900]} />
              <Text style={styles.buttonText}>Add more sets</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button} onPress={onGoToNextExercise}>
              <ChevronRightMini width={18} height={18} stroke={colors.gray[900]} />
              <Text style={styles.buttonText}>Next exercise</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button} onPress={onContinueEditing}>
              <Edit size={18} color={colors.gray[900]} />
              <Text style={styles.buttonText}>Continue editing</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button} onPress={onAddExercise}>
              <Plus size={18} color={colors.gray[900]} />
              <Text style={styles.buttonText}>Add exercise</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: colors.common.white,
    padding: 20,
    marginHorizontal: 30,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  container: {
    padding: 16,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.common.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  buttonText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.gray[900],
  },
});

export default CompletionSheet;