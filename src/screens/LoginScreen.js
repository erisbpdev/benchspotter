import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { getStyles } from '../styles';

export default function LoginScreen({ navigation }) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const handleLogin = async () => {
    if (!emailOrUsername || !password) {
      Alert.alert('error', 'please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // Check if input is email or username
      const isEmail = emailOrUsername.includes('@');
      let email = emailOrUsername;

      // If it's a username, we need to sign in differently
      // Since we can't access auth.users from client, try signing in with email
      // If it fails and looks like a username, show appropriate error
      if (!isEmail) {
        // Check if username exists
        const profile = await api.profiles.getByUsername(emailOrUsername);
        
        if (!profile) {
          setLoading(false);
          Alert.alert('login failed', 'username not found');
          return;
        }

        // Unfortunately we can't get the email from profiles table
        // The user needs to sign in with their email
        setLoading(false);
        Alert.alert(
          'email required',
          'please sign in with your email address instead of username'
        );
        return;
      }

      const { error } = await signIn(email, password);
      setLoading(false);

      if (error) {
        Alert.alert('login failed', error.message);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('login failed', 'something went wrong');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.contentCentered}>
        {/* Theme Toggle */}
        <TouchableOpacity 
          onPress={toggleTheme} 
          style={{ position: 'absolute', top: 60, right: 32 }}
        >
          <Ionicons
            name={isDarkMode ? "sunny-outline" : "moon-outline"}
            size={24}
            color={colors.icon.primary}
          />
        </TouchableOpacity>

        {/* Minimal Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoMark}>
            <View style={styles.logoInner} />
          </View>
          <Text style={styles.title}>benchspotter</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="email"
              placeholderTextColor={colors.input.placeholder}
              value={emailOrUsername}
              onChangeText={setEmailOrUsername}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="password"
              placeholderTextColor={colors.input.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={18} 
                color={colors.icon.secondary} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={colors.button.primaryText} size="small" />
            ) : (
              <Text style={styles.buttonText}>sign in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>create account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
