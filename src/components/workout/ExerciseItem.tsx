import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

// Components
import Icon from '../Icons';
import { IconName } from '../Icons';

import * as SolidIcons from "react-native-heroicons/solid";
import * as OutlineIcons from "react-native-heroicons/outline";
import * as MiniIcons from "react-native-heroicons/mini";

interface ExerciseItemProps {
  exercise: any;
  onPress: () => void;
  getGifUrl: (fileName: string | null) => string | null;
}

const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  onPress,
  getGifUrl
}) => {
  // Get the GIF URL but make it static by adding a frame parameter
  const getStaticGifUrl = (fileName: string | null) => {
    const gifUrl = getGifUrl(fileName);
    if (!gifUrl) return null;
    
    // Add a query parameter to make the GIF static (frame=0)
    // This works because many servers will return just the first frame
    return `${gifUrl}#frame=0`;
  };

  return (
    <TouchableOpacity 
      style={styles.exerciseItem}
      onPress={onPress}
    >
      <View style={styles.exerciseImageContainer}>
        {exercise.added && (
          <View style={styles.checkBadge}>
            <MiniIcons.CheckIcon size={12} color={colors.common.white} />
          </View>
        )}
        <View style={styles.imageWrapper}>
          <Image 
            source={exercise.gif_url 
              /* ? { uri: getGifUrl(exercise.gif_url) } */
              ? { uri: getStaticGifUrl(exercise.gif_url) }
              : { uri: 'https://via.placeholder.com/68x68/333' }}
            style={styles.exerciseImage} 
            resizeMode="cover"
          />
          <View style={styles.blendOverlay} />
        </View>
      </View>
      
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <View style={styles.exerciseDetails}>
          <Text style={styles.exerciseDetail}>{exercise.primary_muscles || 'Unknown'}, </Text>
          <Text style={styles.exerciseDetail}>{exercise.equipment || 'Bodyweight'}</Text>
        </View>
      </View>
      
      <View style={styles.addedContainer}>
        {exercise.added && (
          <Text style={styles.addedText}>Added</Text>
        )}
        {exercise.selected && !exercise.added && (
          <Text style={styles.selectedText}>Selected</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    height: 68,
    paddingRight: 16,
  },
  exerciseImageContainer: {
    width: 68,
    height: 68,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.gray[50],
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  }, 
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  blendOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240,240,240,0.4)',
  } as any,
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.indigo[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  exerciseName: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.gray[900],
    marginBottom: 2,
  },
  exerciseDetails: {
    flexDirection: 'row',
    marginTop: 0,
  },
  exerciseDetail: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.gray[400],
    textTransform: 'capitalize',
  },
  addedContainer: {
    width: 48,
    alignItems: 'flex-end',
  },
  addedText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.indigo[600],
    position: 'absolute',
    justifyContent: 'center',
  },
  selectedText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.indigo[600],
    position: 'absolute',
    justifyContent: 'center',
  },
});

export default ExerciseItem;