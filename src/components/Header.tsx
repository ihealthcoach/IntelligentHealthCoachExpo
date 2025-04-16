import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Icons
import BellOutline from '../assets/icons/bell-outline.svg';
import ChatBubbleOutline from '../assets/icons/chat-bubble-oval-left-ellipsis-outline.svg';
import ArrowLeft from '../assets/icons/arrow-left-solid.svg';

interface HeaderProps {
  profile?: {
    first_name: string | null;
    avatar_url: string | null;
  };
  getFirstName?: () => string;
  showMenu?: boolean;
  goBack?: boolean;
  onMenuPress?: () => void;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  profile, 
  getFirstName = () => 'User', 
  showMenu = true,
  goBack = false,
  onMenuPress = () => {},
  title
}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      {showMenu ? (
        <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
          <View style={styles.menuIcon}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
        </TouchableOpacity>
      ) : goBack ? (
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft width={24} height={24} fill="#111827" />
        </TouchableOpacity>
      ) : (
        <View style={styles.menuButton} />
      )}
      
      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconButton}>
          <View style={styles.notificationContainer}>
            <View style={styles.notificationDot} />
            <BellOutline width={30} height={30} stroke="#111827" />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconButton}>
          <View style={styles.messageIcon} />
          <ChatBubbleOutline width={30} height={30} stroke="#111827" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <Image 
            source={
              profile?.avatar_url 
                ? { uri: profile.avatar_url } 
                : { uri: `https://ui-avatars.com/api/?name=${getFirstName()}` }
            } 
            style={styles.avatar} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 10,
    height: 72,
  },
  menuButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
  },
  backButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  menuLine: {
    height: 2,
    backgroundColor: '#111827',
    borderRadius: 1,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F05252',
    zIndex: 1,
  },
  messageIcon: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F05252',
    zIndex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
});

export default Header;