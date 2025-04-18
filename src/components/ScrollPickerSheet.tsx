import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';

// Fonts
import { fonts } from '../styles/fonts';

// Colors
import { colors } from '../styles/colors';

interface ScrollPickerSheetProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  initialValue?: number;
  maxValue?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  singleLabel?: string;
  pluralLabel?: string;
  onValueConfirm: (value: number) => void;
  confirmButtonText?: string;
}

const ScrollPickerSheet: React.FC<ScrollPickerSheetProps> = ({
  visible,
  onDismiss,
  title = 'How many sets?',
  initialValue = 3,
  maxValue = 20,
  valuePrefix = '',
  valueSuffix = '',
  singleLabel = 'set',
  pluralLabel = 'sets',
  onValueConfirm,
  confirmButtonText
}) => {
  const [selectedValue, setSelectedValue] = useState(initialValue);

  // Reset selectedValue to initialValue whenever the modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setSelectedValue(initialValue);
    }
  }, [visible, initialValue]);

  const handleConfirm = () => {
    onValueConfirm(selectedValue);
    onDismiss();
  };

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
              {title}
            </Text>
            <TouchableOpacity onPress={onDismiss}>
              <Text style={styles.setSheetCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedValue}
              onValueChange={(itemValue) => setSelectedValue(itemValue)}
              style={styles.picker}
            >
              {Array.from({ length: maxValue }, (_, i) => i + 1).map(value => (
                <Picker.Item 
                  key={value} 
                  label={`${valuePrefix}${value}${valueSuffix} ${value === 1 ? singleLabel : pluralLabel}`} 
                  value={value} 
                />
              ))}
            </Picker>
          </View>
          
          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>
              {confirmButtonText || `Confirm ${selectedValue} ${selectedValue === 1 ? singleLabel : pluralLabel}`}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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