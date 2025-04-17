import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native';
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
  // Define itemHeight constant
  const ITEM_HEIGHT = 60; // Height of each item in the list
  
  const data = Array.from({ length: maxSets }, (_, i) => i + 1);
  
  // Scroll to the initial position when visible changes to true
  useEffect(() => {
    if (visible && flatListRef.current) {
      // Set the initial selected value
      setSelectedSet(initialValue);
      
      // The +2 here accounts for the header space (2 item heights)
      const scrollPosition = (initialValue - 1) * ITEM_HEIGHT;
      
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToOffset({
            offset: scrollPosition,
            animated: false,
          });
        } catch (error) {
          console.error("Failed to scroll to initial position:", error);
        }
      }, 300);
    }
  }, [visible, initialValue]);

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT) + 2; // +2 adjustment because of the header space
    if (index >= 0 && index < maxSets) {
      setSelectedSet(index + 1);
    }
  };

  const handleSave = () => {
    onSave(selectedSet);
    onClose();
  };

  const renderItem = React.useCallback(({ item }: { item: number }) => {
    const isSelected = item === selectedSet;

    const MemoizedItem = React.memo(({ item, isSelected, onPress }: {
        item: number;
        isSelected: boolean;
        onPress: () => void;
      }) => (
        <TouchableOpacity 
          style={[styles.setOption, { height: ITEM_HEIGHT }]}
          onPress={onPress}
        >
          <Text
            style={[
              styles.setOptionText,
              isSelected ? styles.selectedSetOptionText : styles.unselectedSetOptionText
            ]}
          >
            {item} {item === 1 ? 'set' : 'sets'}
          </Text>
        </TouchableOpacity>
      ));
    
      return (
        <MemoizedItem 
          item={item}
          isSelected={isSelected}
          onPress={() => {
            setSelectedSet(item);
            flatListRef.current?.scrollToOffset({
              offset: (item - 1) * ITEM_HEIGHT,
              animated: true,
            });
          }}
        />
      );
    }, [selectedSet]);

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
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.bottomIndicator}>
            <View style={styles.indicator} />
          </View>
          
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Add set amount</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
  initialNumToRender={7} // Render fewer items initially
  maxToRenderPerBatch={5} // Render fewer items per batch
  windowSize={7} // Reduce window size
  removeClippedSubviews={true} // Remove items that are off screen
  contentContainerStyle={styles.listContent}
  ListHeaderComponent={<View style={{ height: ITEM_HEIGHT * 2 }} />}
  ListFooterComponent={<View style={{ height: ITEM_HEIGHT * 2 }} />}
/>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>
                    Add {exerciseCount > 1 ? `${exerciseCount} exercises` : 'exercise'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
  setOption: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  setOptionText: {
    fontSize: 24,
    fontFamily: fonts.bold,
  },
  selectedSetOptionText: {
    color: '#111827',
  },
  unselectedSetOptionText: {
    color: '#d1d5db',
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
  modalBackground: {
    zIndex: -1,
  },
});

export default ScrollPickerSheet;