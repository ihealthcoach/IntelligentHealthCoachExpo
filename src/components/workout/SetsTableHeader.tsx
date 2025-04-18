import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

const SetsTableHeader: React.FC = () => {
  return (
    <View style={styles.setTableHeader}>
      <Text style={styles.setTableHeaderText}>SET</Text>
      <Text style={styles.setTableHeaderText}>PREV</Text>
      <Text style={styles.setTableHeaderText}>KG</Text>
      <Text style={styles.setTableHeaderText}>REPS</Text>
      <Text style={styles.setTableHeaderText}>RPE</Text>
      <Text style={styles.setTableHeaderText}>✓</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  setTableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: colors.gray[50],
  },
  setTableHeaderText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
});

export default SetsTableHeader;