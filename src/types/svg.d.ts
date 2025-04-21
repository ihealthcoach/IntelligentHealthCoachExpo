declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  
  /**
   * SVG component interface
   * 
   * Common props:
   * - width: SVG width
   * - height: SVG height
   * - fill: Fill color (for filled icons)
   * - stroke: Stroke color (for outline icons)
   * - style: Style object for additional styling
   * 
   * Plus all standard View props from React Native
   */
  const content: React.FC<SvgProps>;
  export default content;
}