import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Modal, 
  Dimensions, 
  TouchableWithoutFeedback,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from './Icons';
import { Switch } from 'react-native-paper';

// Fonts
import { fonts } from '../styles/fonts';

// Colors
import { colors } from '../styles/colors';

const { height } = Dimensions.get('window');

interface ShortcutSheetProps {
  visible: boolean;
  onClose: () => void;
  onStartWorkout?: () => void;
}

const ShortcutSheet: React.FC<ShortcutSheetProps> = ({
  visible,
  onClose,
  onStartWorkout
}) => {
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(false);
  const navigation = useNavigation();
  const translateY = new Animated.Value(height);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 5
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: height,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  const handleStartWorkout = () => {
    onClose();
    // Wait a bit before triggering the action (similar to the Swift delay)
    setTimeout(() => {
      if (onStartWorkout) {
        onStartWorkout();
      } else {
        navigation.navigate('WorkoutOverviewScreen' as never);
      }
    }, 300);
  };

  const handleBodyMetrics = () => {
    onClose();
    // Navigate to body metrics (would need to implement this screen)
  };

  const handlePreferredUnits = () => {
    onClose();
    // Navigate to preferred units settings
  };

  const handleRestTimer = () => {
    onClose();
    // Navigate to rest timer settings
  };

  const handleAddExercise = () => {
    onClose();
    navigation.navigate('Exercises' as never);
  };

  const handleBrowseRecipes = () => {
    onClose();
    // Navigate to recipes screen
  };

  const handleAddRecipe = () => {
    onClose();
    // Navigate to add recipe screen
  };

  const handleScanBarcode = () => {
    onClose();
    // Navigate to barcode scanner
  };

  const handleConnectApps = () => {
    onClose();
    // Navigate to connections screen
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
                { transform: [{ translateY }] }
              ]}
            >
              {/* Handle at the top */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
              
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Shortcuts</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.sectionsContainer}>
                  {/* Workout section */}
                  <ShortcutSectionHeader title="Workout" />
                  
                  <View style={styles.sectionCard}>
                    <ShortcutItem 
                      iconName="dumbbell" 
                      title="Start a workout" 
                      showChevron={true}
                      onPress={handleStartWorkout}
                    />
                    
                    <ShortcutItem 
                      iconName="ruler-outline" 
                      title="Add body metrics" 
                      showChevron={true}
                      onPress={handleBodyMetrics}
                    />
                    
                    <ShortcutItem 
                      iconName="calculator-outline" 
                      title="Preferred units" 
                      value="Metric/kg"
                      showChevron={true}
                      onPress={handlePreferredUnits}
                    />
                    
                    <ShortcutItem 
                      iconName="clock-outline" 
                      title="Rest timer" 
                      value="45 sec"
                      showChevron={true}
                      onPress={handleRestTimer}
                    />
                    
                    <ShortcutItem 
                      iconName="plus-circle-outline" 
                      title="Add exercise" 
                      showChevron={true}
                      onPress={handleAddExercise}
                    />
                  </View>
                  
                  {/* Food section */}
                  <ShortcutSectionHeader title="Food" />
                  
                  <View style={styles.sectionCard}>
                    <ShortcutItem 
                      iconName="chefs-hat" 
                      title="Browse recipes" 
                      showChevron={true}
                      onPress={handleBrowseRecipes}
                    />
                    
                    <ShortcutItem 
                      iconName="note-add-outline" 
                      title="Add recipe" 
                      showChevron={true}
                      onPress={handleAddRecipe}
                    />
                    
                    <ShortcutItem 
                      iconName="barcode-outline" 
                      title="Scan barcode" 
                      showChevron={true}
                      onPress={handleScanBarcode}
                    />
                  </View>
                  
                  {/* More section */}
                  <ShortcutSectionHeader title="More" />
                  
                  <View style={styles.sectionCard}>
                    <ShortcutItem 
                      iconName="arrows-right-left-outline" 
                      title="Connect apps" 
                      showChevron={true}
                      onPress={handleConnectApps}
                    />
                    
                    <ShortcutItem 
                      iconName={isDarkModeEnabled ? "sun-outline" : "moon-outline"}
                      title={isDarkModeEnabled ? "Light mode" : "Dark mode"}
                      hasToggle={true}
                      isToggled={isDarkModeEnabled}
                      onToggleChange={setIsDarkModeEnabled}
                      onPress={() => {}}
                    />
                  </View>
                  
                  {/* Bottom padding */}
                  <View style={{ height: 34 }} />
                </View>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Section header component
interface SectionHeaderProps {
  title: string;
}

const ShortcutSectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  return (
    <Text style={styles.sectionTitle}>{title}</Text>
  );
};

// Shortcut item component
interface ShortcutItemProps {
  iconName: string;
  title: string;
  value?: string;
  showChevron?: boolean;
  hasToggle?: boolean;
  isToggled?: boolean;
  onToggleChange?: (value: boolean) => void;
  onPress: () => void;
}

const ShortcutItem: React.FC<ShortcutItemProps> = ({
  iconName,
  title,
  value,
  showChevron = false,
  hasToggle = false,
  isToggled = false,
  onToggleChange,
  onPress
}) => {
  return (
    <TouchableOpacity 
      style={styles.shortcutItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.shortcutItemContent}>
        <Icon name={iconName} width={24} height={24} color={colors.gray[900]} />
        
        <Text style={styles.shortcutItemTitle}>{title}</Text>
        
        <View style={styles.shortcutItemRight}>
          {value && (
            <Text style={styles.shortcutItemValue}>{value}</Text>
          )}
          
          {hasToggle ? (
            <Switch
              value={isToggled}
              onValueChange={onToggleChange}
              color={colors.indigo[600]}
            />
          ) : showChevron ? (
            <Icon name="chevron-right-mini" width={20} height={20} color={colors.gray[400]} />
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
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
    width: '100%',
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
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
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.gray[900],
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.indigo[600],
  },
  content: {
    maxHeight: height * 0.7,
  },
  sectionsContainer: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.gray[900],
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 16,
  },
  shortcutItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  shortcutItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortcutItemTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.gray[900],
    marginLeft: 16,
    flex: 1,
  },
  shortcutItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortcutItemValue: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.gray[400],
    marginRight: 8,
  },
});

export default ShortcutSheet;