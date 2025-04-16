import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ExerciseItem from './ExerciseItem';

// Fonts
import { fonts } from '../styles/fonts';

// Colors
import { colors } from '../styles/colors';

interface LetterSectionProps {
  letter: string;
  exercises: any[];
  onLayout: (letter: string, y: number) => void;
  onExerciseSelection: (exercise: any) => void;
  getGifUrl: (fileName: string | null) => string | null;
}

const LetterSection: React.FC<LetterSectionProps> = ({
  letter,
  exercises,
  onLayout,
  onExerciseSelection,
  getGifUrl
}) => {
  return (
    <View 
      style={styles.letterSection}
      onLayout={(event) => {
        const { y } = event.nativeEvent.layout;
        onLayout(letter, y);
      }}
    >
      <Text style={styles.letterHeader}>{letter}</Text>
      {exercises.map(exercise => (
        <ExerciseItem
          key={exercise.id}
          exercise={exercise}
          onPress={() => onExerciseSelection(exercise)}
          getGifUrl={getGifUrl}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  letterSection: {
    marginBottom: 6,
  },
  letterHeader: {
    fontFamily: fonts.semiBold,
    fontSize: 36,
    color: colors.gray[900],
    textAlign: 'right',
    marginBottom: 6,
  },
});

export default LetterSection;