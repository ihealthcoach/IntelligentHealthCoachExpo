import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Plus } from 'lucide-react-native';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

interface SetActionButtonsProps {
  onSaveSet: () => void;
  onAddSet: () => void;
  hasIncompleteSets: boolean;
}

const SetActionButtons: React.FC<SetActionButtonsProps> = ({
  onSaveSet,
  onAddSet,
  hasIncompleteSets
}) => {
  return (
    <View style={styles.container}>
      {/* Save Set Button */}
      <View style={styles.saveSetContainer}>
        <TouchableOpacity 
          style={styles.saveSetButton} 
          onPress={onSaveSet}
          disabled={!hasIncompleteSets}
        >
          <Text style={styles.saveSetText}>Save Set</Text>
          <Check size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Add Set Button */}
      <View style={styles.addSetContainer}>
        <TouchableOpacity 
          style={styles.addSetButton} 
          onPress={onAddSet}
        >
          <Text style={styles.addSetText}>Add set</Text>
          <Plus size={20} color="#374151" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  saveSetContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  saveSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.indigo[600],
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  saveSetText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#FFFFFF',
  },
  addSetContainer: {
    paddingHorizontal: 16,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  addSetText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#374151',
  },
});

export default SetActionButtons;