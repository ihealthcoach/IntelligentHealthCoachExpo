import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { fonts } from './fonts';

export const buttonStyles = StyleSheet.create({
  // Base button styles
  baseButton: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Button variants
  primary: {
    backgroundColor: colors.indigo[600],
  },
  secondary: {
    backgroundColor: colors.common.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  danger: {
    backgroundColor: '#EF4444',
  },
  
  // Button sizes
  small: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  
  // Button states
  disabled: {
    opacity: 0.5,
  },
  
  // Text styles
  baseText: {
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: colors.gray[900],
  },
  dangerText: {
    color: '#FFFFFF',
  },
});