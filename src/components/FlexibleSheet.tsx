import React, { ReactNode, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import { X } from 'lucide-react-native';

// Fonts
import { fonts } from '../styles/fonts';

// Colors
import { colors } from '../styles/colors';

const { height } = Dimensions.get('window');
const DISMISS_THRESHOLD = height * 0.2;

interface FlexibleSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  showCloseButton?: boolean;
  showTopDragIndicator?: boolean;
  showBottomDragIndicator?: boolean;
  children: ReactNode;
  height?: number | string;
  disableDrag?: boolean;
  contentContainerStyle?: object;
}

const FlexibleSheet: React.FC<FlexibleSheetProps> = ({
  visible,
  onClose,
  title,
  showCloseButton = true,
  showTopDragIndicator = true,
  showBottomDragIndicator = false,
  children,
  height = 'auto',
  disableDrag = false,
  contentContainerStyle = {}
}) => {
  const translateY = useRef(new Animated.Value(height)).current;
  const isDragging = useRef(false);
  const scrollOffset = useRef(0);

  useEffect(() => {
    if (visible) {
      // Reset position then animate up
      translateY.setValue(height);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 5
      }).start();
    } else {
      // Animate down when closing
      Animated.timing(translateY, {
        toValue: height,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  // Set up pan responder for drag to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture the gesture if it's a significant downward drag
        // and not already dragging
        return !disableDrag && 
               Math.abs(gestureState.dy) > 5 && 
               scrollOffset.current <= 0 && 
               !isDragging.current;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        translateY.stopAnimation();
        translateY.setOffset(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward movement (positive dy)
        if (gestureState.dy >= 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        isDragging.current = false;
        
        // If dragged down past threshold, dismiss the sheet
        if (gestureState.dy > DISMISS_THRESHOLD || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: height,
            duration: 250,
            useNativeDriver: true
          }).start(onClose);
        } else {
          // Otherwise, snap back to position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 5
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handleScroll = (event) => {
    scrollOffset.current = event.nativeEvent.contentOffset.y;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.container,
                { transform: [{ translateY }] },
                typeof height === 'number' ? { maxHeight: height } : {}
              ]}
            >
              {/* Top drag indicator */}
              {showTopDragIndicator && (
                <View 
                  {...(disableDrag ? {} : panResponder.panHandlers)}
                  style={styles.handleContainer}
                >
                  <View style={styles.handle} />
                </View>
              )}
              
              {/* Header */}
              <View 
                {...(disableDrag ? {} : panResponder.panHandlers)}
                style={styles.header}
              >
                <Text style={styles.title}>{title}</Text>
                
                {showCloseButton && (
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={onClose}
                  >
                    <X size={20} color={colors.gray[900]} />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Content */}
              <View 
                style={[
                  styles.content,
                  contentContainerStyle
                ]}
                onScroll={handleScroll}
              >
                {children}
              </View>
              
              {/* Bottom drag indicator */}
              {showBottomDragIndicator && (
                <View style={styles.bottomHandleContainer}>
                  <View style={styles.handle} />
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.common.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  bottomHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 'auto',
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 100,
    backgroundColor: colors.gray[300],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 30,
    color: colors.gray[900],
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
  }
});

export default FlexibleSheet;