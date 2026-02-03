import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const THEMES = [
  { id: 'dark', label: 'Dark', icon: 'moon', color: '#fff' },
  { id: 'light', label: 'Light', icon: 'sunny', color: '#000' },
  { id: 'blue', label: 'Blue', icon: 'water', color: '#3B82F6' },
  { id: 'lightBlue', label: 'Sky', icon: 'cloudy', color: '#0EA5E9' },
  { id: 'pink', label: 'Pink', icon: 'heart', color: '#EC4899' },
  { id: 'lightPink', label: 'Rose', icon: 'rose', color: '#F472B6' },
];

export default function ThemeSelector() {
  const { theme, setTheme, colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text.tertiary }]}>
        theme
      </Text>
      <View style={styles.themesGrid}>
        {THEMES.map((themeOption) => {
          const isSelected = theme === themeOption.id;
          return (
            <TouchableOpacity
              key={themeOption.id}
              style={[
                styles.themeButton,
                { 
                  backgroundColor: colors.surface,
                  borderColor: isSelected ? colors.button.primary : colors.border,
                  borderWidth: isSelected ? 2 : 1,
                }
              ]}
              onPress={() => setTheme(themeOption.id)}
            >
              <Ionicons 
                name={themeOption.icon} 
                size={24} 
                color={isSelected ? themeOption.color : colors.text.secondary} 
              />
              <Text 
                style={[
                  styles.themeLabel, 
                  { 
                    color: isSelected ? colors.text.primary : colors.text.secondary,
                    fontWeight: isSelected ? '500' : '300'
                  }
                ]}
              >
                {themeOption.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeButton: {
    flex: 1,
    minWidth: '30%',
    maxWidth: '32%',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  themeLabel: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
});