import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

// Styles
import { fonts } from '../styles/fonts';
import { colors } from '../styles/colors';

// Components
import Icon from './Icons';
import { IconName } from './Icons';

// Sheet Action Button component (similar to SheetActionButton in SwiftUI)
interface SheetActionButtonProps {
  title: string;
  onPress: () => void;
  showArrow?: boolean;
}

export const SheetActionButton: React.FC<SheetActionButtonProps> = ({
  title,
  onPress,
  showArrow = false
}) => {
  return (
    <TouchableOpacity 
      style={styles.actionButton}
      onPress={onPress}
    >
      <Text style={styles.actionButtonText}>{title}</Text>
      
      {showArrow && (
        <ChevronRight size={16} color={colors.gray[400]} />
      )}
    </TouchableOpacity>
  );
};

// Option Button component (similar to SheetOptionButton in SwiftUI)
interface SheetOptionButtonProps {
  title: string;
  subtitle: string;
  isSelected?: boolean;
  showArrow?: boolean;
  onPress: () => void;
}

export const SheetOptionButton: React.FC<SheetOptionButtonProps> = ({
  title,
  subtitle,
  isSelected = false,
  showArrow = false,
  onPress
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.optionButton,
        isSelected && styles.optionButtonSelected
      ]}
      onPress={onPress}
    >
      <View style={styles.optionTextContainer}>
        <Text style={[
          styles.optionTitle,
          isSelected && styles.optionTitleSelected
        ]}>
          {title}
        </Text>
        
        <Text style={styles.optionSubtitle}>
          {subtitle}
        </Text>
      </View>
      
      {showArrow && (
        <Icon name="chevron-right-mini" width={16} height={16} color={colors.gray[900]} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.gray[50],
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  actionButtonText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.gray[900],
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  optionButtonSelected: {
    backgroundColor: colors.common.white,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.gray[500],
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: colors.gray[900],
  },
  optionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.gray[500],
  }
});