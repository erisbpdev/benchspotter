import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

export default function LocationDisplay({ location, onRefresh }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.inputWrapper}>
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={16} color={colors.icon.secondary} />
        <Text style={styles.locationText}>
          {location
            ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
            : 'getting location...'}
        </Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={16} color={colors.icon.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}