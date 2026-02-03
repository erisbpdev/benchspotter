import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

export default function SearchInput({ value, onChangeText, onClear }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.searchBar}>
      <Ionicons name="search-outline" size={18} color={colors.icon.secondary} />
      <TextInput
        style={styles.searchInput}
        placeholder="search benches..."
        placeholderTextColor={colors.input.placeholder}
        value={value}
        onChangeText={onChangeText}
      />
      {value.trim() && (
        <TouchableOpacity onPress={onClear}>
          <Ionicons name="close-circle" size={18} color={colors.icon.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}