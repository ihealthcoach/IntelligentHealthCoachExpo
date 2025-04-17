import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Modal, 
  TouchableWithoutFeedback, 
  Animated,
  AccessibilityInfo
} from 'react-native';
import { Check, X } from 'lucide-react-native';

// Fonts
import { fonts } from '../styles/fonts';

interface ScrollPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  initialValue?: number;
  onSave: (count: number) => void;
  maxSets?: number;
  exerciseCount?: number;
}

const ScrollPickerSheet: React.FC<ScrollPickerSheetProps> = ({
  visible,
  onClose,
  initialValue = 3,
  onSave,
  maxSets = 20,
  exerciseCount = 1
}) => {
  const [selectedSet, setSelectedSet] = useState(initialValue);
  const flatListRef = useRef<FlatList>(null);
  const opacityAnimation = useRef(new Animated.Value(0)).current;
  const ITEM_HEIGHT = 60;
  
  // Memoize data array to prevent recreating it on every render
  const data = useMemo(() => 
    Array.from({ length: maxSets }, (_, i) => i + 1), 
    [maxSets]
  );
  
  // Animate the modal content when visible changes
  useEffect(() => {
    if (visible) {
      Animated.timing(opacityAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(opacityAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);
  
  // Setup initial scroll position and selection
  useEffect(() => {
    if (visible && flatListRef.current) {
      // Set initial value
      setSelectedSet(initialValue);
      
      // Calculate scroll position with adjustment for centered viewing
      const scrollPosition = Math.max(0, (initialValue - 3) * ITEM_HEIGHT);
      
      // Wait for modal animation to complete
      const timer = setTimeout(() => {
        try {
          flatListRef.current?.scrollToOffset({
            offset: scrollPosition,
            animated: false,
          });
        } catch (error) {
          console.error("Failed to scroll to initial position:", error);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [visible, initialValue]);

  // Handle scroll events to update selection
  const handleScroll = (event: any) => {
    try {
      const y = event.nativeEvent.contentOffset.y;
      const centerY = y + (ITEM_HEIGHT * 2.5); // Center of the visible area
      const index = Math.floor(centerY / ITEM_HEIGHT);
      
      if (index >= 0 && index < maxSets) {
        setSelectedSet(index + 1);
      }
    } catch (error) {
      console.error("Error in scroll handler:", error);
    }
  };

  // Save the selected value and close
  const handleSave = () => {
    try {
      // Provide haptic feedback if available
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      onSave(selectedSet);
      onClose();
    } catch (error) {
      console.error("Error saving value:", error);
      // Fallback - still close the modal
      onClose();
    }
  };

  // Memoized render item function for performance
  const renderItem = React.useCallback(({ item }: { item: number }) => {
    const isSelected = item === selectedSet;
    
    return (
      <MemoizedItem 
        item={item}
        isSelected={isSelected}
        onPress={() => {
          setSelectedSet(item);
          
          // Scroll to position the selected item in the center
          flatListRef.current?.scrollToOffset({
            offset: Math.max(0, (item - 3) * ITEM_HEIGHT),
            animated: true,
          });
        }}
      />
    );
  }, [selectedSet]);

  // Memoized item component to improve list performance
  const MemoizedItem = React.memo(({ 
    item, 
    isSelected, 
    onPress 
  }: {
    item: number;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity 
      style={styles.setOption}
      onPress={onPress}
      accessible={true}
      accessibilityLabel={`${item} ${item === 1 ? 'set' : 'sets'}`}
      accessibilityState={{ selected: isSelected }}
      accessibilityHint={`Select ${item} ${item === 1 ? 'set' : 'sets'}`}
    >
      <Animated.Text
        style={[
          styles.setOptionText,
          isSelected ? styles.selectedSetOptionText : styles.unselectedSetOptionText,
          // Add a subtle scale animation when selected
          isSelected && {
            transform: [{ scale: 1.05 }]
          }
        ]}
      >
        {item} {item === 1 ? 'set' : 'sets'}
      </Animated.Text>
    </TouchableOpacity>
  ));

  // Optimize FlatList performance with getItemLayout
  const getItemLayout = (_, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            { opacity: opacityAnimation }
          ]}
        >
          <View style={styles.bottomIndicator}>
            <View style={styles.indicator} />
          </View>
          
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Add set amount</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={onClose}
                accessible={true}
                accessibilityLabel="Close"
                accessibilityHint="Closes the set picker without saving"
              >
                <X width={20} height={20} color="#111827" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContainer}>
              <View style={styles.selectionWindow}>
                <View style={styles.selectionBorder} />
                <View style={styles.checkContainer}>
                  <Check width={24} height={24} color="#111827" />
                </View>
              </View>
              
              <FlatList
                ref={flatListRef}
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => item.toString()}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                snapToAlignment="center"
                onScroll={handleScroll}
                onMomentumScrollEnd={handleScroll}
                getItemLayout={getItemLayout}
                initialNumToRender={10}
                maxToRenderPerBatch={5}
                windowSize={7}
                removeClippedSubviews={true}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={<View style={{ height: ITEM_HEIGHT * 2 }} />}
                ListFooterComponent={<View style={{ height: ITEM_HEIGHT * 2 }} />}
                accessible={true}
                accessibilityLabel="Set quantity picker"
                accessibilityHint="Scroll to select the number of sets"
              />
            </View>

            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
              accessible={true}
              accessibilityLabel={`Add ${exerciseCount > 1 ? exerciseCount + ' exercises' : 'exercise'} with ${selectedSet} sets`}
              accessibilityHint="Confirms your selection and adds the exercise(s)"
            >
              <Text style={styles.saveButtonText}>
                Add {exerciseCount > 1 ? `${exerciseCount} exercises` : 'exercise'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Background tap area to close the modal */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackground} />
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fcfefe',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  bottomIndicator: {
    width: '100%',
    height: 21,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: 48,
    height: 5,
    borderRadius: 100,
    backgroundColor: '#d1d5db',
  },
  content: {
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#111827',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerContainer: {
    height: 240,
    position: 'relative',
  },
  listContent: {
    paddingVertical: 0,
  },
  selectionWindow: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 60, // Use exact value here
    transform: [{ translateY: -30 }],
    zIndex: 10,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  checkContainer: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  saveButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 5,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fcfefe',
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  setOption: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 20,
  },
  setOptionText: {
    fontSize: 24,
    fontFamily: fonts.bold,
    //transition: '0.2s',
  },
  selectedSetOptionText: {
    color: '#111827',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  unselectedSetOptionText: {
    color: '#d1d5db',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
});

export default ScrollPickerSheet;