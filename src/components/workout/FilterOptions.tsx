import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowDownAZ, Search, Clock, Heart, Filter } from 'lucide-react-native';

// Styles
import { fonts } from '../../styles/fonts';
import { colors } from '../../styles/colors';

// Define filter types
export type FilterType = 'a-z' | 'search' | 'recent' | 'favorite' | 'filters';

// Filter item definition
export interface FilterItem {
  id: FilterType;
  icon: string;
  label: string;
}

// Props interface
interface FilterOptionsProps {
  activeFilter: FilterType;
  onFilterChange: (filterId: FilterType) => void;
}

// Default filter options
export const defaultFilters: FilterItem[] = [
  { id: 'a-z', icon: 'bars-arrow-down', label: 'A-Z' },
  { id: 'search', icon: 'search', label: 'Search' },
  { id: 'recent', icon: 'clock', label: 'Recent' },
  { id: 'favorite', icon: 'heart', label: 'Favorites' },
  { id: 'filters', icon: 'filter', label: 'Filters' }
];

const FilterOptions: React.FC<FilterOptionsProps> = ({
  activeFilter,
  onFilterChange
}) => {
  // Render filter icon
  const renderFilterIcon = (iconName: string, color: string) => {
    const iconSize = 20;
    
    try {
      switch (iconName) {
        case 'bars-arrow-down':
          return <ArrowDownAZ size={iconSize} color={color} />;
        case 'search':
          return <Search size={iconSize} color={color} />;
        case 'clock':
          return <Clock size={iconSize} color={color} />;
        case 'heart':
          return <Heart size={iconSize} color={color} />;
        case 'filter':
          return <Filter size={iconSize} color={color} />;
        default:
          console.warn(`Unknown icon name: ${iconName}`);
          return null;
      }
    } catch (error) {
      console.error(`Error rendering icon ${iconName}:`, error);
      return null;
    }
  };

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filtersContainer}
    >
      {defaultFilters.map((filter) => (
        <TouchableOpacity
          key={filter.id}
          style={[
            styles.filterBadge,
            activeFilter === filter.id ? styles.activeFilterBadge : styles.inactiveFilterBadge
          ]}
          onPress={() => onFilterChange(filter.id)}
        >
          {renderFilterIcon(
            filter.icon, 
            activeFilter === filter.id ? '#FCFDFD' : '#4B555F'
          )}
          <Text 
            style={[
              styles.filterLabel,
              activeFilter === filter.id ? styles.activeFilterLabel : styles.inactiveFilterLabel
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  filtersContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    paddingVertical: 8,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 8,
    height: 40,
  },
  activeFilterBadge: {
    backgroundColor: colors.gray[900],
  },
  inactiveFilterBadge: {
    backgroundColor: colors.gray[50],
  },
  filterLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    marginLeft: 4,
  },
  activeFilterLabel: {
    color: '#FCFDFD',
  },
  inactiveFilterLabel: {
    color: '#4B555F',
  },
});

export default FilterOptions;