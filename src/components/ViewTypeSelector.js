import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

const VIEW_TYPES = [
  { label: 'ocean', value: 'ocean', icon: 'water' },
  { label: 'mountain', value: 'mountain', icon: 'triangle' },
  { label: 'urban', value: 'urban', icon: 'business' },
  { label: 'forest', value: 'forest', icon: 'leaf' },
  { label: 'lake', value: 'lake', icon: 'water-outline' },
  { label: 'river', value: 'river', icon: 'boat' },
  { label: 'desert', value: 'desert', icon: 'sunny' },
  { label: 'valley', value: 'valley', icon: 'analytics' },
  { label: 'other', value: 'other', icon: 'ellipsis-horizontal' },
];

export default function ViewTypeSelector({ selectedValue, onValueChange }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>view type</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.viewTypesContainer}
      >
        {VIEW_TYPES.map((type) => {
          const isSelected = selectedValue === type.value;
          
          return (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.viewTypeButton,
                isSelected && styles.viewTypeButtonActive,
              ]}
              onPress={() => onValueChange(type.value)}
            >
              <Ionicons 
                name={type.icon} 
                size={16} 
                color={isSelected ? colors.button.primaryText : colors.icon.secondary} 
              />
              <Text
                style={[
                  styles.viewTypeText,
                  isSelected && styles.viewTypeTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}