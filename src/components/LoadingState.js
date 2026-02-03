import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * LoadingState component displays a centered loading indicator
 * with an optional message.
 *
 * @param {Object} props
 * @param {string} props.message - Optional message to display below the spinner
 * @param {string} props.size - Size of the ActivityIndicator ('small' | 'large')
 * @param {boolean} props.fullScreen - Whether to take full screen height
 */
export default function LoadingState({ message = 'Loading...', size = 'large', fullScreen = true }) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: fullScreen ? 1 : undefined,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: fullScreen ? colors.background : 'transparent',
      minHeight: fullScreen ? undefined : 120,
    },
    message: {
      marginTop: 12,
      fontSize: 14,
      color: colors.text.secondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.icon.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}
