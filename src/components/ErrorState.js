import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

/**
 * ErrorState component displays an error message with an optional retry button.
 * Use this for recoverable errors within a screen (as opposed to ErrorBoundary
 * which catches unhandled exceptions).
 *
 * @param {Object} props
 * @param {string} props.message - The error message to display
 * @param {Function} props.onRetry - Optional callback to retry the failed operation
 * @param {string} props.icon - Optional Ionicons icon name (default: 'alert-circle-outline')
 * @param {boolean} props.fullScreen - Whether to take full screen height
 */
export default function ErrorState({
  message = 'Something went wrong',
  onRetry,
  icon = 'alert-circle-outline',
  fullScreen = true,
}) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: fullScreen ? 1 : undefined,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: fullScreen ? colors.background : 'transparent',
      minHeight: fullScreen ? undefined : 200,
    },
    iconContainer: {
      marginBottom: 16,
    },
    message: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: onRetry ? 20 : 0,
      lineHeight: 22,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    retryButtonText: {
      color: colors.text.primary,
      fontSize: 14,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={48} color={colors.destructive} />
      </View>

      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={18} color={colors.text.primary} />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
