import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { fonts } from './fonts';

export const formStyles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.gray[700],
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.gray[900],
    backgroundColor: colors.common.white,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  helperText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
});