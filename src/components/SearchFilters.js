import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

const VIEW_TYPES = [
  { label: 'all', value: null },
  { label: 'ocean', value: 'ocean' },
  { label: 'mountain', value: 'mountain' },
  { label: 'urban', value: 'urban' },
  { label: 'forest', value: 'forest' },
  { label: 'lake', value: 'lake' },
  { label: 'river', value: 'river' },
  { label: 'desert', value: 'desert' },
  { label: 'valley', value: 'valley' },
  { label: 'other', value: 'other' },
];

const RATING_FILTERS = [
  { label: 'all ratings', value: null },
  { label: '4+ stars', value: 4 },
  { label: '3+ stars', value: 3 },
  { label: '2+ stars', value: 2 },
];

const SORT_OPTIONS = [
  { label: 'nearest', value: 'distance' },
  { label: 'highest rated', value: 'rating' },
  { label: 'most recent', value: 'recent' },
];

const DISTANCE_OPTIONS = [
  { label: 'all', value: null },
  { label: '2km', value: 2 },
  { label: '5km', value: 5 },
  { label: '10km', value: 10 },
  { label: '20km', value: 20 },
  { label: '50km', value: 50 },
];

export default function SearchFilters({
  viewType,
  ratingFilter,
  distanceFilter,
  sortBy,
  onViewTypeChange,
  onRatingFilterChange,
  onDistanceFilterChange,
  onSortByChange,
  onClearFilters,
  hasActiveFilters
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <ScrollView style={styles.filtersPanel} showsVerticalScrollIndicator={false}>
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>view type</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterOptions}
        >
          {VIEW_TYPES.map((type) => (
            <TouchableOpacity
              key={type.label}
              style={[
                styles.filterChip,
                viewType === type.value && styles.filterChipActive,
              ]}
              onPress={() => onViewTypeChange(type.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  viewType === type.value && styles.filterChipTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>rating</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterOptions}
        >
          {RATING_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.label}
              style={[
                styles.filterChip,
                ratingFilter === filter.value && styles.filterChipActive,
              ]}
              onPress={() => onRatingFilterChange(filter.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  ratingFilter === filter.value && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>max distance</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterOptions}
        >
          {DISTANCE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterChip,
                distanceFilter === option.value && styles.filterChipActive,
              ]}
              onPress={() => onDistanceFilterChange(option.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  distanceFilter === option.value && styles.filterChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>sort by</Text>
        <View style={styles.filterOptions}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterChip,
                sortBy === option.value && styles.filterChipActive,
              ]}
              onPress={() => onSortByChange(option.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  sortBy === option.value && styles.filterChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {hasActiveFilters && (
        <TouchableOpacity style={styles.clearButton} onPress={onClearFilters}>
          <Text style={styles.clearButtonText}>clear filters</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}