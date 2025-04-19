import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { Play, Pause, RefreshCw } from 'lucide-react-native';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

// Components
import Icon from '../Icons';
import { IconName } from '../Icons';

interface RestTimerProps {
  isActive: boolean;
  timeRemaining: number;
  defaultDuration: number;
  formatTime: (seconds: number) => string;
  skipRestTimer: () => void;
  pauseRestTimer: () => void;
  resumeRestTimer: () => void;
  startRestTimer: (exerciseId: string, setId: string) => void;
  exerciseId: string | null;
  setId: string | null;
}

const RestTimer: React.FC<RestTimerProps> = ({
  isActive,
  timeRemaining,
  defaultDuration,
  formatTime,
  skipRestTimer,
  pauseRestTimer,
  resumeRestTimer,
  startRestTimer,
  exerciseId,
  setId
}) => {
  return (
    <View style={styles.restTimerContainer}>
      <View style={styles.restTimerContent}>
        <Text style={styles.restTimerTitle}>Rest Timer</Text>
        <Text style={styles.restTimerTime}>{formatTime(timeRemaining)}</Text>
        
        <ProgressBar 
          progress={timeRemaining / defaultDuration} 
          color="#4F46E5"
          style={styles.restTimerProgress}
        />
        
        <View style={styles.restTimerControls}>
          <TouchableOpacity style={styles.restTimerButton} onPress={skipRestTimer}>
            <Text style={styles.restTimerButtonText}>Skip</Text>
          </TouchableOpacity>
          
          {isActive ? (
            <TouchableOpacity style={styles.restTimerButton} onPress={pauseRestTimer}>
              <Pause size={20} color={colors.gray[900]} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.restTimerButton} onPress={resumeRestTimer}>
              <Play size={20} color={colors.gray[900]} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.restTimerButton} 
            onPress={() => startRestTimer(exerciseId!, setId!)}
          >
            <RefreshCw size={20} color={colors.gray[900]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  restTimerContainer: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    zIndex: 20,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  restTimerContent: {
    padding: 16,
  },
  restTimerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
    textAlign: 'center',
  },
  restTimerTime: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  restTimerProgress: {
    height: 6,
    borderRadius: 3,
    marginBottom: 16,
  },
  restTimerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  restTimerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  restTimerButtonText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.gray[900],
  },
});

export default RestTimer;