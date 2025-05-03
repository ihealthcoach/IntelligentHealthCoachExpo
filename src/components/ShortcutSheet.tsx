import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Switch 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Components
import FlexibleSheet from './FlexibleSheet';

// Styles
import { fonts } from '../styles/fonts';
import { colors } from '../styles/colors';

// Components
import Icon from './Icons';
import { IconName } from './Icons';

// https://www.npmjs.com/package/react-native-heroicons
import * as SolidIcons from "react-native-heroicons/solid";
import * as OutlineIcons from "react-native-heroicons/outline";
import * as MiniIcons from "react-native-heroicons/mini";
import { Ruler } from 'iconsax-react-native';

interface ShortcutSheetProps {
  visible: boolean;
  onClose: () => void;
  onStartWorkout?: () => void;
}

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
  iconName: IconName;
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
  trackColor={{ false: 'colors.common.white', true: colors.indigo[600] }}
  thumbColor={isToggled ? 'colors.common.white' : 'colors.gray[200]'}
/>
          ) : showChevron ? (
            <Icon name="chevron-right-mini" width={20} height={20} color={colors.gray[400]} />
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ShortcutSheet: React.FC<ShortcutSheetProps> = ({
  visible,
  onClose,
  onStartWorkout
}) => {
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(false);
  const navigation = useNavigation();

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
    <FlexibleSheet
      visible={visible}
      onClose={onClose}
      title="Shortcuts"
      initialHeight="70%"
      maxHeight="90%"
      minHeight="30%"
    >
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
    </FlexibleSheet>
  );
};

const styles = StyleSheet.create({
  sectionsContainer: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.gray[900],
    marginTop: 16,
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 8,
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