import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

// Fonts
import { fonts } from '../styles/fonts';

// Colors
import { colors } from '../styles/colors';

interface ScrollPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  initialValue?: number;
  onSave: (count: number) => void;
  maxSets?: number;
  exerciseCount?: number;
}

const ScrollPickerSheet: React.FC<ScrollPickerSheetProps> = ({
  visible,
  onClose,
  initialValue = 3,
  onSave,
  maxSets = 50,
  exerciseCount = 1
}) => {
  const [selectedSet, setSelectedSet] = useState(initialValue);

  // Create a simple version matching ExercisesScreen.tsx exactly
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.setSheetContainer}>
        <View style={styles.setSheetContent}>
          <View style={styles.setSheetHeader}>
            <Text style={styles.setSheetTitle}>
              How many sets?
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.setSheetCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedSet}
              onValueChange={(itemValue) => setSelectedSet(itemValue)}
              style={styles.picker}
            >
              {Array.from({ length: maxSets }, (_, i) => i + 1).map(value => (
                <Picker.Item 
                  key={value} 
                  label={`${value} set${value > 1 ? 's' : ''}`} 
                  value={value} 
                />
              ))}
            </Picker>
          </View>
          
          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={() => {
              onSave(selectedSet);
              onClose();
            }}
          >
            <Text style={styles.confirmButtonText}>
              Confirm {selectedSet} set{selectedSet > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  setSheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  setSheetContent: {
    backgroundColor: colors.common.white,
    margin: 20,
    borderRadius: 12,
    padding: 20,
    paddingBottom: 40,
  },
  setSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  setSheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.gray[900],
  },
  setSheetCancel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#4F46E5',
  },
  pickerContainer: {
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  picker: {
    height: 150,
    width: '100%',
  },
  confirmButton: {
    backgroundColor: colors.gray[900],
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontFamily: fonts.medium,
    color: '#FFFFFF',
    fontSize: 16,
  }
});

export default ScrollPickerSheet;