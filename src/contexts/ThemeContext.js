import React, { createContext, useState, useEffect, useContext, useMemo, useRef } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({});

// Dark theme colors
const darkTheme = {
  background: '#000',
  surface: '#000',
  surfaceElevated: '#0A0A0A',
  border: '#262626',
  text: {
    primary: '#fff',
    secondary: '#9CA3AF',
    tertiary: '#6B7280',
    muted: '#4B5563',
  },
  button: {
    primary: '#fff',
    primaryText: '#000',
    secondary: 'rgba(0, 0, 0, 0.8)',
    secondaryText: '#fff',
    outline: '#262626',
    outlineText: '#fff',
  },
  input: {
    background: 'transparent',
    border: '#262626',
    text: '#fff',
    placeholder: '#6B7280',
  },
  card: {
    background: '#000',
    border: '#262626',
  },
  icon: {
    primary: '#fff',
    secondary: '#6B7280',
    muted: '#4B5563',
  },
  overlay: 'rgba(0, 0, 0, 0.95)',
  mapOverlay: 'rgba(0, 0, 0, 0.8)',
  destructive: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  // Tab bar specific
  tabBar: {
    background: '#000',
    border: '#262626',
    active: '#fff',
    inactive: '#6B7280',
  },
  // Logo colors
  logo: {
    mark: '#fff',
    inner: '#000',
  },
};

// Light theme colors
const lightTheme = {
  background: '#fff',
  surface: '#F9FAFB',
  surfaceElevated: '#fff',
  border: '#E5E7EB',
  text: {
    primary: '#000',
    secondary: '#4B5563',
    tertiary: '#6B7280',
    muted: '#9CA3AF',
  },
  button: {
    primary: '#000',
    primaryText: '#fff',
    secondary: 'rgba(255, 255, 255, 0.9)',
    secondaryText: '#000',
    outline: '#E5E7EB',
    outlineText: '#000',
  },
  input: {
    background: '#fff',
    border: '#E5E7EB',
    text: '#000',
    placeholder: '#9CA3AF',
  },
  card: {
    background: '#fff',
    border: '#E5E7EB',
  },
  icon: {
    primary: '#000',
    secondary: '#6B7280',
    muted: '#9CA3AF',
  },
  overlay: 'rgba(0, 0, 0, 0.5)',
  mapOverlay: 'rgba(255, 255, 255, 0.9)',
  destructive: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  // Tab bar specific
  tabBar: {
    background: '#fff',
    border: '#E5E7EB',
    active: '#000',
    inactive: '#9CA3AF',
  },
  // Logo colors
  logo: {
    mark: '#000',
    inner: '#fff',
  },
};

// Blue theme colors (dark)
const blueTheme = {
  background: '#0A1628',
  surface: '#0F1D35',
  surfaceElevated: '#152844',
  border: '#1E3A5F',
  text: {
    primary: '#E0F2FE',
    secondary: '#93C5FD',
    tertiary: '#60A5FA',
    muted: '#3B82F6',
  },
  button: {
    primary: '#3B82F6',
    primaryText: '#fff',
    secondary: 'rgba(59, 130, 246, 0.2)',
    secondaryText: '#93C5FD',
    outline: '#1E3A5F',
    outlineText: '#93C5FD',
  },
  input: {
    background: 'transparent',
    border: '#1E3A5F',
    text: '#E0F2FE',
    placeholder: '#60A5FA',
  },
  card: {
    background: '#0F1D35',
    border: '#1E3A5F',
  },
  icon: {
    primary: '#93C5FD',
    secondary: '#60A5FA',
    muted: '#3B82F6',
  },
  overlay: 'rgba(10, 22, 40, 0.95)',
  mapOverlay: 'rgba(10, 22, 40, 0.85)',
  destructive: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  tabBar: {
    background: '#0A1628',
    border: '#1E3A5F',
    active: '#3B82F6',
    inactive: '#60A5FA',
  },
  logo: {
    mark: '#3B82F6',
    inner: '#0A1628',
  },
};

// Light Blue theme colors
const lightBlueTheme = {
  background: '#F0F9FF',
  surface: '#E0F2FE',
  surfaceElevated: '#BAE6FD',
  border: '#7DD3FC',
  text: {
    primary: '#0C4A6E',
    secondary: '#075985',
    tertiary: '#0369A1',
    muted: '#0284C7',
  },
  button: {
    primary: '#0284C7',
    primaryText: '#fff',
    secondary: 'rgba(2, 132, 199, 0.1)',
    secondaryText: '#0369A1',
    outline: '#7DD3FC',
    outlineText: '#0369A1',
  },
  input: {
    background: '#fff',
    border: '#7DD3FC',
    text: '#0C4A6E',
    placeholder: '#0284C7',
  },
  card: {
    background: '#fff',
    border: '#7DD3FC',
  },
  icon: {
    primary: '#0369A1',
    secondary: '#0284C7',
    muted: '#0EA5E9',
  },
  overlay: 'rgba(0, 0, 0, 0.5)',
  mapOverlay: 'rgba(240, 249, 255, 0.9)',
  destructive: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  tabBar: {
    background: '#F0F9FF',
    border: '#7DD3FC',
    active: '#0284C7',
    inactive: '#0EA5E9',
  },
  logo: {
    mark: '#0284C7',
    inner: '#F0F9FF',
  },
};

// Pink theme colors (dark)
const pinkTheme = {
  background: '#1A0A14',
  surface: '#2D1525',
  surfaceElevated: '#3D1F33',
  border: '#5C2E4F',
  text: {
    primary: '#FCE7F3',
    secondary: '#F9A8D4',
    tertiary: '#F472B6',
    muted: '#EC4899',
  },
  button: {
    primary: '#EC4899',
    primaryText: '#fff',
    secondary: 'rgba(236, 72, 153, 0.2)',
    secondaryText: '#F9A8D4',
    outline: '#5C2E4F',
    outlineText: '#F9A8D4',
  },
  input: {
    background: 'transparent',
    border: '#5C2E4F',
    text: '#FCE7F3',
    placeholder: '#F472B6',
  },
  card: {
    background: '#2D1525',
    border: '#5C2E4F',
  },
  icon: {
    primary: '#F9A8D4',
    secondary: '#F472B6',
    muted: '#EC4899',
  },
  overlay: 'rgba(26, 10, 20, 0.95)',
  mapOverlay: 'rgba(26, 10, 20, 0.85)',
  destructive: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  tabBar: {
    background: '#1A0A14',
    border: '#5C2E4F',
    active: '#EC4899',
    inactive: '#F472B6',
  },
  logo: {
    mark: '#EC4899',
    inner: '#1A0A14',
  },
};

// Light Pink theme colors
const lightPinkTheme = {
  background: '#FDF2F8',
  surface: '#FCE7F3',
  surfaceElevated: '#FBCFE8',
  border: '#F9A8D4',
  text: {
    primary: '#831843',
    secondary: '#9F1239',
    tertiary: '#BE185D',
    muted: '#DB2777',
  },
  button: {
    primary: '#DB2777',
    primaryText: '#fff',
    secondary: 'rgba(219, 39, 119, 0.1)',
    secondaryText: '#BE185D',
    outline: '#F9A8D4',
    outlineText: '#BE185D',
  },
  input: {
    background: '#fff',
    border: '#F9A8D4',
    text: '#831843',
    placeholder: '#DB2777',
  },
  card: {
    background: '#fff',
    border: '#F9A8D4',
  },
  icon: {
    primary: '#BE185D',
    secondary: '#DB2777',
    muted: '#EC4899',
  },
  overlay: 'rgba(0, 0, 0, 0.5)',
  mapOverlay: 'rgba(253, 242, 248, 0.9)',
  destructive: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  tabBar: {
    background: '#FDF2F8',
    border: '#F9A8D4',
    active: '#DB2777',
    inactive: '#EC4899',
  },
  logo: {
    mark: '#DB2777',
    inner: '#FDF2F8',
  },
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark'); // 'dark', 'light', 'blue', 'pink'
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themePreference');
      if (savedTheme !== null) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const setThemePreference = async (newTheme) => {
    try {
      // Animate fade out, change theme, animate fade in
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // 3. Fade back in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });

      // Change theme in the middle of the animation
      setTimeout(() => {
        setTheme(newTheme);
      }, 150);

      await AsyncStorage.setItem('themePreference', newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    // Legacy toggle for dark/light - cycles through all themes now
    const themes = ['dark', 'light', 'blue', 'lightBlue', 'pink', 'lightPink'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    await setThemePreference(nextTheme);
  };

  const getThemeColors = () => {
    switch (theme) {
      case 'light':
        return lightTheme;
      case 'blue':
        return blueTheme;
      case 'lightBlue':
        return lightBlueTheme;
      case 'pink':
        return pinkTheme;
      case 'lightPink':
        return lightPinkTheme;
      case 'dark':
      default:
        return darkTheme;
    }
  };

  const colors = useMemo(() => getThemeColors(), [theme]);
  const isDarkMode = theme === 'dark'; // For backward compatibility

  const value = {
    colors,
    theme,
    setTheme: setThemePreference,
    isDarkMode,
    toggleTheme,
    loading,
    fadeAnim, // Export animation value for wrapping components
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    </Animated.View>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export themes for reference
export { darkTheme, lightTheme, blueTheme, lightBlueTheme, pinkTheme, lightPinkTheme };