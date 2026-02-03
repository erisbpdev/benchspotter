import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

/**
 * ErrorFallback component displays a user-friendly error message
 * with an optional retry button.
 *
 * @param {Object} props
 * @param {Error} props.error - The error that was caught
 * @param {Function} props.onRetry - Callback to retry/reset the error state
 * @param {string} props.message - Optional custom message to display
 */
export default function ErrorFallback({ error, onRetry, message }) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    iconContainer: {
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 8,
      textAlign: 'center',
    },
    message: {
      fontSize: 14,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
    },
    errorDetails: {
      fontSize: 12,
      color: colors.text.tertiary,
      textAlign: 'center',
      marginBottom: 24,
      fontFamily: 'monospace',
    },
    retryButton: {
      backgroundColor: colors.button.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    retryButtonText: {
      color: colors.button.primaryText,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.destructive} />
      </View>

      <Text style={styles.title}>Something went wrong</Text>

      <Text style={styles.message}>
        {message || "We're sorry, but something unexpected happened. Please try again."}
      </Text>

      {__DEV__ && error?.message && (
        <Text style={styles.errorDetails}>{error.message}</Text>
      )}

      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={20} color={colors.button.primaryText} />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
