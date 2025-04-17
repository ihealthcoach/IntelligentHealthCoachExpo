// Central location for all color definitions in the app

export const colors = {
    // Base colors
    primary: {
      main: '#4F46E5', // Indigo
      light: '#818CF8',
      dark: '#3730A3',
      contrast: '#FFFFFF'
    },
    
    // Secondary colors
    secondary: {
      main: '#111827', // Dark gray/almost black
      light: '#374151',
      dark: '#030712',
      contrast: '#FFFFFF'
    },
  
    // Accent colors
    accent: {
      blue: '#3B82F6',
      green: '#10B981',
      red: '#EF4444',
      yellow: '#F59E0B',
      purple: '#8B5CF6'
    },
    
    // Semantic colors
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6'
    },
    
    // Grayscale
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
      950: '#030712'
    },
    
    // Common named colors
    common: {
      white: '#FCFEFE',
      black: '#000000',
      background: '#F3F4F6',
      card: '#FFFFFF',
      text: '#111827',
      border: '#E5E7EB'
    },
    
    // Status colors for various UI elements
    status: {
      active: '#10B981',
      inactive: '#9CA3AF',
      disabled: '#E5E7EB'
    },
    
    // Progress indicators
    progress: {
      low: '#EF4444',
      medium: '#F59E0B',
      high: '#10B981'
    }
  };
  
  // Type definitions for colors to provide better TypeScript support
  export type ColorsPrimary = typeof colors.primary;
  export type ColorsSecondary = typeof colors.secondary;
  export type ColorsAccent = typeof colors.accent;
  export type ColorsSemantic = typeof colors.semantic;
  export type ColorsGray = typeof colors.gray;
  export type ColorsCommon = typeof colors.common;
  export type ColorsStatus = typeof colors.status;
  export type ColorsProgress = typeof colors.progress;
  
  export type Colors = typeof colors;
  
  export default colors;