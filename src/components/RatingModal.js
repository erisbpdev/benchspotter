import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

export default function RatingModal({
  visible,
  onClose,
  viewRating,
  comfortRating,
  onViewRatingChange,
  onComfortRatingChange,
  onSubmit
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  if (!visible) return null;

  const renderStars = (rating, onRatingChange) => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onRatingChange(star)}
        >
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={40}
            color={colors.icon.primary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>rate bench</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.icon.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
          <Text style={styles.inputLabel}>view quality</Text>
          {renderStars(viewRating, onViewRatingChange)}

          <Text style={[styles.inputLabel, { marginTop: 32 }]}>comfort</Text>
          {renderStars(comfortRating, onComfortRatingChange)}
        </View>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (viewRating === 0 || comfortRating === 0) && styles.saveButtonDisabled
            ]}
            onPress={onSubmit}
            disabled={viewRating === 0 || comfortRating === 0}
          >
            <Text style={styles.saveButtonText}>submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}