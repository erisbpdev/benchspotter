import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

export default function RatingDisplay({
  ratings,
  user,
  userRating,
  onRatePress
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const calculateAverageRatings = () => {
    if (ratings.length === 0) return { view: 0, comfort: 0 };
    const avgView = ratings.reduce((sum, r) => sum + r.view_rating, 0) / ratings.length;
    const avgComfort = ratings.reduce((sum, r) => sum + r.comfort_rating, 0) / ratings.length;
    return { view: avgView.toFixed(1), comfort: avgComfort.toFixed(1) };
  };

  const averages = calculateAverageRatings();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>ratings</Text>

      <View style={styles.ratingsRow}>
        <View style={styles.ratingItem}>
          <Text style={styles.ratingValue}>
            {averages.view > 0 ? averages.view : '—'}
          </Text>
          <Text style={styles.ratingLabel}>view</Text>
        </View>

        <View style={styles.ratingDivider} />

        <View style={styles.ratingItem}>
          <Text style={styles.ratingValue}>
            {averages.comfort > 0 ? averages.comfort : '—'}
          </Text>
          <Text style={styles.ratingLabel}>comfort</Text>
        </View>
      </View>

      <Text style={styles.ratingCount}>
        {ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'}
      </Text>

      {user && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onRatePress}
        >
          <Text style={styles.actionButtonText}>
            {userRating ? 'update rating' : 'rate bench'}
          </Text>
        </TouchableOpacity>
      )}

      {userRating && (
        <Text style={styles.yourRating}>
          your rating: view {userRating.view_rating} • comfort {userRating.comfort_rating}
        </Text>
      )}
    </View>
  );
}