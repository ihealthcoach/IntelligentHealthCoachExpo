import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronUp, ChevronDown } from 'lucide-react-native';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

interface HistoryRecord {
  date: string;
  weight: number;
  reps: number;
  volume: number;
}

interface ExerciseHistorySectionProps {
  history?: HistoryRecord[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const ExerciseHistorySection: React.FC<ExerciseHistorySectionProps> = ({
  history = [],
  isExpanded,
  onToggleExpand
}) => {
  return (
    <View style={styles.historySection}>
      <TouchableOpacity 
        style={styles.historySectionHeader}
        onPress={onToggleExpand}
      >
        <Text style={styles.historySectionTitle}>Exercise History</Text>
        {isExpanded ? (
          <ChevronUp size={20} color={colors.gray[900]} />
        ) : (
          <ChevronDown size={20} color={colors.gray[900]} />
        )}
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.historyContent}>
          {/* Table header */}
          <View style={styles.historyTableHeader}>
            <Text style={styles.historyHeaderDate}>Date</Text>
            <Text style={styles.historyHeaderWeight}>Weight</Text>
            <Text style={styles.historyHeaderReps}>Reps</Text>
            <Text style={styles.historyHeaderVolume}>Volume</Text>
          </View>
          
          {/* History items */}
          {history.length > 0 ? (
            history.map((record, idx) => (
              <View key={idx} style={styles.historyItem}>
                <Text style={styles.historyDate}>
                  {new Date(record.date).toLocaleDateString()}
                </Text>
                <Text style={styles.historyWeight}>{record.weight}kg</Text>
                <Text style={styles.historyReps}>{record.reps} reps</Text>
                <Text style={styles.historyVolume}>{record.volume}kg</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noHistoryText}>
              No previous data for this exercise
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  historySection: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  historySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historySectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.gray[900],
  },
  historyContent: {
    padding: 16,
  },
  historyTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historyHeaderDate: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#6B7280',
  },
  historyHeaderWeight: {
    width: 60,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  historyHeaderReps: {
    width: 60,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  historyHeaderVolume: {
    width: 60,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyDate: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#4B5563',
  },
  historyWeight: {
    width: 60,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.gray[900],
    textAlign: 'center',
  },
  historyReps: {
    width: 60,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.gray[900],
    textAlign: 'center',
  },
  historyVolume: {
    width: 60,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.gray[900],
    textAlign: 'center',
  },
  noHistoryText: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#6B7280',
    padding: 16,
  },
});

export default ExerciseHistorySection;