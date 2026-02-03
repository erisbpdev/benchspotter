import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

function SearchResultCard({ bench, onPress }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const primaryPhoto = bench.bench_photos?.find(p => p.is_primary);

  return (
    <TouchableOpacity
      style={styles.benchCard}
      onPress={onPress}
    >
      {primaryPhoto ? (
        <Image
          source={{ uri: primaryPhoto.photo_url }}
          style={styles.benchImage}
        />
      ) : (
        <View style={styles.benchImagePlaceholder}>
          <Ionicons name="image-outline" size={32} color={colors.icon.muted} />
        </View>
      )}

      <View style={styles.benchInfo}>
        <Text style={styles.benchViewType}>{bench.view_type}</Text>
        <Text style={styles.benchTitle}>{bench.title}</Text>

        {bench.description && (
          <Text style={styles.benchDescription} numberOfLines={2}>
            {bench.description}
          </Text>
        )}

        <View style={styles.benchMeta}>
          {bench.avgRating > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={colors.icon.primary} />
              <Text style={styles.ratingText}>
                {bench.avgRating.toFixed(1)}
              </Text>
            </View>
          )}

          {bench.distance !== null && (
            <Text style={styles.distanceText}>
              {bench.distance < 1
                ? `${(bench.distance * 1000).toFixed(0)}m away`
                : `${bench.distance.toFixed(1)}km away`
              }
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Memoize to prevent re-renders in list
export default React.memo(SearchResultCard, (prevProps, nextProps) => {
  // Only re-render if bench data or handlers changed
  return (
    prevProps.bench.id === nextProps.bench.id &&
    prevProps.bench.avgRating === nextProps.bench.avgRating &&
    prevProps.bench.distance === nextProps.bench.distance &&
    prevProps.onPress === nextProps.onPress
  );
});