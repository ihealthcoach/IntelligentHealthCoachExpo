import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

interface OneRepMaxCardProps {
  estimatedOneRepMax: number | null;
}

const OneRepMaxCard: React.FC<OneRepMaxCardProps> = ({
  estimatedOneRepMax
}) => {
  return (
    <View style={styles.oneRepMaxSection}>
      <View style={styles.oneRepMaxCard}>
        <Text style={styles.oneRepMaxTitle}>Estimated 1RM</Text>
        <Text style={styles.oneRepMaxValue}>
          {estimatedOneRepMax ? 
            `${Math.round(estimatedOneRepMax)}kg` : 
            'Complete a set to calculate'
          }
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  oneRepMaxSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  oneRepMaxCard: {
    backgroundColor: colors.indigo[600],
    borderRadius: 8,
    padding: 16,
  },
  oneRepMaxTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#E0E7FF',
    marginBottom: 4,
  },
  oneRepMaxValue: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: '#FFFFFF',
  },
});

export default OneRepMaxCard;