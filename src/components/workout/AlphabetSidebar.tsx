import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

// Components
import Icon from '../Icons';
import { IconName } from '../Icons';

interface AlphabetSidebarProps {
  alphabet: string[];
  availableLetters: Record<string, boolean>;
  onLetterPress: (letter: string) => void;
}

const AlphabetSidebar: React.FC<AlphabetSidebarProps> = ({ 
  alphabet, 
  availableLetters, 
  onLetterPress 
}) => {
  return (
    <View style={styles.alphabetContainer}>
      {alphabet.map((letter) => (
        <TouchableOpacity
          key={letter}
          onPress={() => onLetterPress(letter)}
          disabled={!availableLetters[letter]}
        >
          <Text
            style={[
              styles.alphabetLetter,
              !availableLetters[letter] && styles.alphabetLetterInactive
            ]}
          >
            {letter}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  alphabetContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingRight: 2,
    zIndex: 10,
  },
  alphabetLetter: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.gray[900],
    paddingVertical: 1,
  },
  alphabetLetterInactive: {
    color: colors.gray[300],
  },
});

export default AlphabetSidebar;