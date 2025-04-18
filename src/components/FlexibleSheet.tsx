import React, { ReactNode, useRef, useEffect, useState } from 'react';
import { 
  View, 
  Text,
  Animated, 
  PanResponder, 
  Dimensions, 
  StyleSheet, 
  ScrollView, 
  TouchableWithoutFeedback,
  TouchableOpacity 
} from 'react-native';

// Fonts
import { fonts } from '../styles/fonts';

// Colors
import { colors } from '../styles/colors';

// Get screen dimensions
const { height } = Dimensions.get('window');

interface FlexibleSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  initialHeight?: number | string;
  maxHeight?: number | string;
  minHeight?: number | string;
  cancelText?: string;
}

const FlexibleSheet: React.FC<FlexibleSheetProps> = ({
  visible,
  onClose,
  children,
  title = "Select Option",
  initialHeight = '50%',
  maxHeight = '80%',
  minHeight = '20%',
  cancelText = "Cancel"
}) => {
  // Convert percentage strings to actual numbers
  const getPixelValue = (value: number | string): number => {
    if (typeof value === 'number') return value;
    // If it's a percentage string, convert to pixel value
    if (typeof value === 'string' && value.endsWith('%')) {
      const percentage = parseFloat(value) / 100;
      return height * percentage;
    }
    return parseFloat(value); // Fallback to parsing as a number
  };

  const initialHeightPx = getPixelValue(initialHeight);
  const maxHeightPx = getPixelValue(maxHeight);
  const minHeightPx = getPixelValue(minHeight);

  // State for sheet height - use regular state instead of Animated
  const [sheetHeightValue, setSheetHeightValue] = useState(initialHeightPx);
  
  // Animation values - only use translateY with native driver
  const translateY = useRef(new Animated.Value(height)).current;
  
  // Track scrolling and dragging
  const scrollOffset = useRef(0);
  const isDragging = useRef(false);
  
  // Reset height when visible changes
  useEffect(() => {
    if (visible) {
      setSheetHeightValue(initialHeightPx);
    }
  }, [visible, initialHeightPx]);
  
  // Animation when visibility changes
  useEffect(() => {
    if (visible) {
      // Show sheet animation
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    } else {
      // Hide sheet animation
      Animated.timing(translateY, {
        toValue: height,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [visible, translateY]);

  // Set up pan responder for drag to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only handle vertical movements
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
      },
      onPanResponderMove: (_, gestureState) => {
        // Handle gestures differently based on context
        if (scrollOffset.current <= 0 && gestureState.dy > 0) {
          // If at top of scroll view and dragging down, resize sheet
          const newHeight = Math.max(
            minHeightPx,
            Math.min(maxHeightPx, initialHeightPx - gestureState.dy)
          );
          setSheetHeightValue(newHeight);
        } else if (gestureState.dy > 0 && isDragging.current) {
          // If dragging down elsewhere, allow dismissal
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        isDragging.current = false;
        
        // Handle release - dismiss or snap back
        if (gestureState.dy > height * 0.2 || gestureState.vy > 0.5) {
          // Dismiss threshold reached
          Animated.timing(translateY, {
            toValue: height,
            duration: 250,
            useNativeDriver: true
          }).start(onClose);
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 5
          }).start();
          
          // Reset height separately
          setSheetHeightValue(initialHeightPx);
        }
      }
    })
  ).current;

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      
      <Animated.View 
        style={[
          styles.sheetContainer,
          { transform: [{ translateY }] }
        ]}
      >
        <View style={{ height: sheetHeightValue }}>
          {/* Drag handle */}
          <View 
            style={styles.handleContainer} 
            {...panResponder.panHandlers}
          >
            <View style={styles.handle} />
          </View>
          
          {/* Header with title and close button */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButtonText}>{cancelText}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Content area */}
          <ScrollView 
            style={styles.contentContainer}
            onScroll={(event) => {
              scrollOffset.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
          >
            {children}
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.gray[300],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.gray[900],
  },
  closeButtonText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.indigo[600],
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  }
});

export default FlexibleSheet;