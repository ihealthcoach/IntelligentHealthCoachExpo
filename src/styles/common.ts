import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { fonts } from './fonts';

export const commonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  
  // Card styles
  card: {
    backgroundColor: colors.common.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  
  // Text styles
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.gray[900],
    marginBottom: 12,
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: colors.indigo[600],
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: colors.common.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.gray[900],
  },
  
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.gray[50],
  },
  
  // Form elements
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
    marginBottom: 16,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.common.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  
  // Modal styles
  modalContainer: {
    backgroundColor: colors.common.white,
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  
  // Utility styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  chip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  
  // Empty states
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
  },
});