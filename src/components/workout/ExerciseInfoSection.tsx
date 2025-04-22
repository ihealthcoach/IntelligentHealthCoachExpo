import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

interface ExerciseInfoSectionProps {
  primaryMuscles?: string;
  equipment?: string;
  targetMuscleGroups?: string[];
}

const ExerciseInfoSection: React.FC<ExerciseInfoSectionProps> = ({
  primaryMuscles = '',
  equipment = '',
  targetMuscleGroups = []
}) => {
  return (
    <View style={styles.infoSection}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Exercise Information</Text>
        <Text style={styles.infoDescription}>
          {primaryMuscles} • {equipment}
        </Text>
        
        {/* Exercise target muscle groups */}
        {targetMuscleGroups && targetMuscleGroups.length > 0 && (
          <View style={styles.muscleTags}>
            {targetMuscleGroups.map((muscle, idx) => (
              <View key={idx} style={styles.muscleTag}>
                <Text style={styles.muscleTagText}>{muscle}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  infoSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.gray[900],
    marginBottom: 8,
  },
  infoDescription: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  muscleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  muscleTag: {
    backgroundColor: colors.gray[100],
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  muscleTagText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#4B5563',
  },
});

export default ExerciseInfoSection;