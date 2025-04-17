import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import BottomSheet from './BottomSheet';

// Fonts
import { fonts } from '../styles/fonts';

// Colors
import { colors } from '../styles/colors';

interface SetPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  initialValue?: number;
  onSave: (count: number) => void;
  maxSets?: number;
  exerciseCount?: number;
}

const SetPickerSheet: React.FC<SetPickerSheetProps> = ({
  visible,
  onClose,
  initialValue = 3,
  onSave,
  maxSets = 50,
  exerciseCount = 1
}) => {
  const [selectedSet, setSelectedSet] = useState(initialValue);

  const handleSetSelection = (count: number) => {
    setSelectedSet(count);
  };

  const handleSave = () => {
    onSave(selectedSet);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add set amount"
    >
      <ScrollView style={styles.setList}>
        {Array.from({ length: maxSets }, (_, i) => i + 1).map(count => (
          <TouchableOpacity
            key={count}
            style={[
              styles.setOption,
              selectedSet === count && styles.selectedSetOption
            ]}
            onPress={() => handleSetSelection(count)}
          >
            <Text
              style={[
                styles.setOptionText,
                selectedSet === count && styles.selectedSetOptionText
              ]}
            >
              {count} {count === 1 ? 'set' : 'sets'}
            </Text>
            {selectedSet === count && (
              <Check width={24} height={24} color="#111827" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>
          Add {exerciseCount > 1 ? `${exerciseCount} exercises` : 'exercise'}
        </Text>
      </TouchableOpacity>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  setList: {
    maxHeight: 350,
  },
  setOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  selectedSetOption: {
    borderBottomColor: '#e5e7eb',
  },
  setOptionText: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#d1d5db',
  },
  selectedSetOptionText: {
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 5,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fcfefe',
    fontSize: 16,
    fontFamily: fonts.medium,
  },
});

export default SetPickerSheet;