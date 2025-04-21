import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Keyboard } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import FlexibleSheet from '../../components/FlexibleSheet';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

// Set type options
const SET_TYPES = [
  { label: 'Standard set', value: 'standard' },
  { label: 'Drop set', value: 'drop' },
  { label: 'Negative set', value: 'negative' },
  { label: 'Rest pause set', value: 'rest_pause' },
  { label: 'Warm up set', value: 'warm_up' },
];

interface SetKeyboardWrapperProps {
  activeSet: any;
  weight: string;
  reps: string;
  setType: string;
  onWeightChange: (text: string) => void;
  onRepsChange: (text: string) => void;
  onSetTypeChange: (type: string) => void;
  onSave: () => void;
}

const SetKeyboardWrapper: React.FC<SetKeyboardWrapperProps> = ({ 
  activeSet, 
  weight, 
  reps,
  setType,
  onWeightChange, 
  onRepsChange,
  onSetTypeChange,
  onSave
}) => {
  const [showSetTypePicker, setShowSetTypePicker] = useState(false);
  
  // Get the label for the current set type
  const currentSetTypeLabel = SET_TYPES.find(t => t.value === setType)?.label || 'Standard set';

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Set {activeSet.setNumber}</Text>
        </View>
        
        <View style={styles.content}>
          {/* Set Type Selector */}
          <TouchableOpacity 
            style={styles.setTypeSelector}
            onPress={() => setShowSetTypePicker(true)}
          >
            <Text style={styles.setTypeText}>{currentSetTypeLabel}</Text>
            <ChevronDown size={16} color={colors.gray[500]} />
          </TouchableOpacity>
          
          <View style={styles.inputRow}>
            {/* Weight Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Weight</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={onWeightChange}
                  keyboardType="numeric"
                  placeholder="0"
                    onFocus={() => {
    // Keep parent components from hiding when this gets focus
    // No need to do anything specific here
  }}
                />
                <Text style={styles.inputUnit}>kg</Text>
              </View>
            </View>
            
            {/* Reps Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Reps</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={reps}
                  onChangeText={onRepsChange}
                  keyboardType="numeric"
                  placeholder="0"
                />
                <Text style={styles.inputUnit}>reps</Text>
              </View>
            </View>
          </View>
          
          {/* Save Button */}
          <TouchableOpacity 
            style={[
              styles.saveButton,
              (!weight || !reps) && styles.saveButtonDisabled
            ]}
            onPress={onSave}
            disabled={!weight || !reps}
          >
            <Text style={styles.saveButtonText}>Save set</Text>
            <Check size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Set Type Picker Sheet */}
      <FlexibleSheet
        visible={showSetTypePicker}
        onClose={() => setShowSetTypePicker(false)}
        title="Select Set Type"
        initialHeight="40%"
      >
        <View style={styles.setTypeList}>
          {SET_TYPES.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.setTypeItem,
                setType === item.value && styles.setTypeItemActive
              ]}
              onPress={() => {
                onSetTypeChange(item.value);
                setShowSetTypePicker(false);
              }}
            >
              <Text 
                style={[
                  styles.setTypeItemText,
                  setType === item.value && styles.setTypeItemTextActive
                ]}
              >
                {item.label}
              </Text>
              {setType === item.value && (
                <Check size={18} color={colors.indigo[600]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </FlexibleSheet>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[50],
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.gray[900],
  },
  content: {
    padding: 16,
  },
  setTypeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.common.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  setTypeText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.gray[900],
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.gray[700],
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.common.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.gray[900],
  },
  inputUnit: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.gray[500],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.indigo[600],
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  saveButtonText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.common.white,
  },
  setTypeList: {
    marginTop: 8,
  },
  setTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  setTypeItemActive: {
    backgroundColor: colors.gray[50],
  },
  setTypeItemText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.gray[900],
  },
  setTypeItemTextActive: {
    color: colors.indigo[600],
  },
});

export default SetKeyboardWrapper;