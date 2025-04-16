// src/components/ExerciseItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';

// Fonts
import { fonts } from '../styles/fonts';

// Colors
import { colors } from '../styles/colors';

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
  return (
    <TouchableOpacity 
      style={styles.exerciseItem}
      onPress={onPress}
    >
      <View style={styles.exerciseImageContainer}>
        {exercise.selected && (
          <View style={styles.checkBadge}>
            <Check size={12} color="#FCFDFD" />
          </View>
        )}
        <View style={styles.imageWrapper}>
          <Image 
            source={exercise.gif_url 
              ? { uri: getGifUrl(exercise.gif_url) } 
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
      
      {exercise.added && (
        <View style={styles.addedContainer}>
          <Text style={styles.addedText}>Added</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    height: 68,
  },
  exerciseImageContainer: {
    width: 68,
    height: 68,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
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
    marginBottom: 0,
  },
  exerciseDetails: {
    flexDirection: 'row',
    marginTop: 0,
  },
  exerciseDetail: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#9CA3AF',
    marginRight: 2,
    textTransform: 'capitalize',
  },
  addedContainer: {
    width: 36,
    alignItems: 'flex-end',
  },
  addedText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#4F46E5',
  },
});

export default ExerciseItem;