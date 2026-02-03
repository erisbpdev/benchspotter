import React from 'react';
import { View, TextInput } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

export default function FormInput({
  placeholder,
  value,
  onChangeText,
  multiline = false,
  numberOfLines = 1,
  ...props
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.inputWrapper}>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        placeholder={placeholder}
        placeholderTextColor={colors.input.placeholder}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
        {...props}
      />
    </View>
  );
}