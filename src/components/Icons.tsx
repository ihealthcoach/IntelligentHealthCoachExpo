import React from 'react';
import { SvgProps } from 'react-native-svg';

// Import all SVG icons
import ArrowPathRoundedSquareOutline from '../assets/icons/arrow-path-rounded-square-outline.svg';
import LockClosedOutline from '../assets/icons/lock-closed-outline.svg';
import PlusCircleOutline from '../assets/icons/plus-circle-outline.svg';
import CheckMini from '../assets/icons/check-mini.svg';
import DumbbellIcon from '../assets/icons/dumbbell.svg';
import QuestionMarkCircleOutline from '../assets/icons/question-mark-circle-outline.svg';
import GoogleIcon from '../assets/icons/google.svg';
import InformationCircleOutline from '../assets/icons/information-circle-outline.svg';
import ChatBubbleOvalLeftEllipsisOutline from '../assets/icons/chat-bubble-oval-left-ellipsis-outline.svg';
import UserOutline from '../assets/icons/user-outline.svg';
import BarcodeOutline from '../assets/icons/barcode-outline.svg';
import ChevronDownMini from '../assets/icons/chevron-down-mini.svg';
import StarOutline from '../assets/icons/star-outline.svg';
import ActivityOutline from '../assets/icons/activity-outline.svg';
import BarsArrowDownOutline from '../assets/icons/bars-arrow-down-outline.svg';
import AppleIcon from '../assets/icons/apple.svg';
import BellOutline from '../assets/icons/bell-outline.svg';
import NoteAddOutline from '../assets/icons/note-add-outline.svg';
import ClockOutline from '../assets/icons/clock-outline.svg';
import ChevronDownOutline from '../assets/icons/chevron-down-outline.svg';
import Bars3BottomLeftMini from '../assets/icons/bars-3-bottom-left-mini.svg';
import XMarkMini from '../assets/icons/x-mark-mini.svg';
import HomeOutline from '../assets/icons/home-outline.svg';
import FacebookIcon from '../assets/icons/facebook.svg';
import CalculatorOutline from '../assets/icons/calculator-outline.svg';
import MoonOutline from '../assets/icons/moon-outline.svg';
import LineHeight from '../assets/icons/line-height.svg';
import FaceIdIcon from '../assets/icons/faceid.svg';
import GlobeAltOutline from '../assets/icons/globe-alt-outline.svg';
import FireMini from '../assets/icons/fire-mini.svg';
import SortOutline from '../assets/icons/sort-outline.svg';
import ChevronRightMini from '../assets/icons/chevron-right-mini.svg';
import ArrowRightMini from '../assets/icons/arrow-right-mini.svg';
import MagnifyingGlassOutline from '../assets/icons/magnifying-glass-outline.svg';
import CheckBadgeOutline from '../assets/icons/check-badge-outline.svg';
import ArrowsRightLeftOutline from '../assets/icons/arrows-right-left-outline.svg';
import ChartBarOutline from '../assets/icons/chart-bar-outline.svg';
import CalendarDaysOutline from '../assets/icons/calendar-days-outline.svg';
import ChefsHatIcon from '../assets/icons/chefs-hat.svg';
import StepsIcon from '../assets/icons/steps.svg';
import CreditCardOutline from '../assets/icons/credit-card-outline.svg';
import TrashOutline from '../assets/icons/trash-outline.svg';
import ClipboardDocumentListOutline from '../assets/icons/clipboard-document-list-outline.svg';
import LogoIhealth from '../assets/icons/logo_ihealth.svg';
import RulerOutline from '../assets/icons/ruler-outline.svg';
import ExportOutline from '../assets/icons/export-outline.svg';
import HeartOutline from '../assets/icons/heart-outline.svg';
import ArrowRightSolid from '../assets/icons/arrow-right-solid.svg';
import MapPinOutline from '../assets/icons/map-pin-outline.svg';
import SunOutline from '../assets/icons/sun-outline.svg';
import ArrowLeftSolid from '../assets/icons/arrow-left-solid.svg';
import PlusMini from '../assets/icons/plus-mini.svg';

// Define an interface for our Icon component props
interface IconProps extends SvgProps {
  name: IconName;
  size?: number;
  color?: string;
}

// Define all available icon names as a type
export type IconName =
  | 'arrow-path-rounded-square-outline'
  | 'lock-closed-outline'
  | 'plus-circle-outline'
  | 'check-mini'
  | 'dumbbell'
  | 'question-mark-circle-outline'
  | 'google'
  | 'information-circle-outline'
  | 'chat-bubble-oval-left-ellipsis-outline'
  | 'user-outline'
  | 'barcode-outline'
  | 'chevron-down-mini'
  | 'star-outline'
  | 'activity-outline'
  | 'bars-arrow-down-outline'
  | 'apple'
  | 'bell-outline'
  | 'note-add-outline'
  | 'clock-outline'
  | 'chevron-down-outline'
  | 'bars-3-bottom-left-mini'
  | 'x-mark-mini'
  | 'home-outline'
  | 'facebook'
  | 'calculator-outline'
  | 'moon-outline'
  | 'line-height'
  | 'faceid'
  | 'globe-alt-outline'
  | 'fire-mini'
  | 'sort-outline'
  | 'chevron-right-mini'
  | 'arrow-right-mini'
  | 'magnifying-glass-outline'
  | 'check-badge-outline'
  | 'arrows-right-left-outline'
  | 'chart-bar-outline'
  | 'calendar-days-outline'
  | 'chefs-hat'
  | 'steps'
  | 'credit-card-outline'
  | 'trash-outline'
  | 'clipboard-document-list-outline'
  | 'logo-ihealth'
  | 'ruler-outline'
  | 'export-outline'
  | 'heart-outline'
  | 'arrow-right-solid'
  | 'map-pin-outline'
  | 'sun-outline'
  | 'arrow-left-solid'
  | 'plus-mini';

// Map icon names to their components
const iconMap = {
  'arrow-path-rounded-square-outline': ArrowPathRoundedSquareOutline,
  'lock-closed-outline': LockClosedOutline,
  'plus-circle-outline': PlusCircleOutline,
  'check-mini': CheckMini,
  'dumbbell': DumbbellIcon,
  'question-mark-circle-outline': QuestionMarkCircleOutline,
  'google': GoogleIcon,
  'information-circle-outline': InformationCircleOutline,
  'chat-bubble-oval-left-ellipsis-outline': ChatBubbleOvalLeftEllipsisOutline,
  'user-outline': UserOutline,
  'barcode-outline': BarcodeOutline,
  'chevron-down-mini': ChevronDownMini,
  'star-outline': StarOutline,
  'activity-outline': ActivityOutline,
  'bars-arrow-down-outline': BarsArrowDownOutline,
  'apple': AppleIcon,
  'bell-outline': BellOutline,
  'note-add-outline': NoteAddOutline,
  'clock-outline': ClockOutline,
  'chevron-down-outline': ChevronDownOutline,
  'bars-3-bottom-left-mini': Bars3BottomLeftMini,
  'x-mark-mini': XMarkMini,
  'home-outline': HomeOutline,
  'facebook': FacebookIcon,
  'calculator-outline': CalculatorOutline,
  'moon-outline': MoonOutline,
  'line-height': LineHeight,
  'faceid': FaceIdIcon,
  'globe-alt-outline': GlobeAltOutline,
  'fire-mini': FireMini,
  'sort-outline': SortOutline,
  'chevron-right-mini': ChevronRightMini,
  'arrow-right-mini': ArrowRightMini,
  'magnifying-glass-outline': MagnifyingGlassOutline,
  'check-badge-outline': CheckBadgeOutline,
  'arrows-right-left-outline': ArrowsRightLeftOutline,
  'chart-bar-outline': ChartBarOutline,
  'calendar-days-outline': CalendarDaysOutline,
  'chefs-hat': ChefsHatIcon,
  'steps': StepsIcon,
  'credit-card-outline': CreditCardOutline,
  'trash-outline': TrashOutline,
  'clipboard-document-list-outline': ClipboardDocumentListOutline,
  'logo-ihealth': LogoIhealth,
  'ruler-outline': RulerOutline,
  'export-outline': ExportOutline,
  'heart-outline': HeartOutline,
  'arrow-right-solid': ArrowRightSolid,
  'map-pin-outline': MapPinOutline,
  'sun-outline': SunOutline,
  'arrow-left-solid': ArrowLeftSolid,
  'plus-mini': PlusMini,
};

// Create the Icon component
const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#111827', stroke, fill, ...props }) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  
  // Special case handling for different icon types
  const iconProps: any = { ...props }; // Use any type to avoid TypeScript errors
  
  // Set default size
  iconProps.width = size;
  iconProps.height = size;
  
  // Handle fill-only icons (like plus-mini.svg which has fill in the SVG root)
  // These icons often have the fill attribute at the SVG level
  if (['plus-mini', 'check-mini', 'fire-mini', 'chevron-down-mini', 'x-mark-mini', 
       'chevron-right-mini', 'arrow-right-mini'].includes(name)) {
    iconProps.fill = fill || color;
    // No stroke needed
  }
  // Handle rule-based icons like chefs-hat (which use fill-rule and clip-rule)
  else if (['chefs-hat', 'dumbbell', 'steps', 'faceid'].includes(name)) {
    iconProps.fill = fill || color;
    // These typically don't need stroke
    iconProps.stroke = stroke || 'none';
  }
  // Standard outline icons (which use stroke and have fill="none")
  else if (name.includes('outline')) {
    iconProps.stroke = stroke || color;
    iconProps.fill = fill || 'none'; 
  }
  // Solid icons (typically use fill)
  else if (name.includes('solid')) {
    iconProps.fill = fill || color;
    iconProps.stroke = stroke || 'none';
  }
  // Default case - apply both fill and stroke
  else {
    iconProps.stroke = stroke || color;
    iconProps.fill = fill || color;
  }
  
  return <IconComponent {...iconProps} />;
};

export default Icon;