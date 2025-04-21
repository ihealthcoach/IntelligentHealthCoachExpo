import React, { useMemo, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

interface AlphabetSidebarProps {
  alphabet: string[];
  availableLetters: Record<string, boolean>;
  onLetterPress: (letter: string) => void;
  selectedLetter?: string;
}

// Using React.memo to prevent unnecessary re-renders
const AlphabetSidebar: React.FC<AlphabetSidebarProps> = memo(({ 
  alphabet, 
  availableLetters, 
  onLetterPress,
  selectedLetter
}) => {
  // Use useMemo to cache the letter elements for better performance
  const letterElements = useMemo(() => {
    return alphabet.map((letter) => {
      const isAvailable = availableLetters[letter];
      const isSelected = letter === selectedLetter;
      
      return (
        <TouchableOpacity
          key={letter}
          onPress={() => isAvailable && onLetterPress(letter)}
          disabled={!isAvailable}
        >
          <Text
            style={[
              styles.alphabetLetter,
              !isAvailable && styles.alphabetLetterInactive,
              isSelected && styles.alphabetLetterSelected
            ]}
          >
            {letter}
          </Text>
        </TouchableOpacity>
      );
    });
  }, [alphabet, availableLetters, onLetterPress, selectedLetter]);
  
  return (
    <View style={styles.alphabetContainer}>
      {letterElements}
    </View>
  );
});

const styles = StyleSheet.create({
  alphabetContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 48,
    paddingRight: 6,
    zIndex: 10,
  },
  alphabetLetter: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.gray[400],
    paddingVertical: 1,
    textAlign: 'center',
  },
  alphabetLetterSelected: {
    color: colors.gray[900],
  },
  alphabetLetterInactive: {
    color: colors.gray[200],
  },
});

export default AlphabetSidebar;