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
  ScrollView,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { getStyles } from '../styles';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(null); // { uri, base64, mimeType }
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const pickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera roll permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setAvatar({
          uri: asset.uri,
          base64: asset.base64,
          mimeType: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('Error picking avatar:', error);
      Alert.alert('Error', 'Could not pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setAvatar({
          uri: asset.uri,
          base64: asset.base64,
          mimeType: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Could not take photo');
    }
  };

  const showAvatarOptions = () => {
    Alert.alert(
      'add profile photo',
      'choose an option',
      [
        { text: 'take photo', onPress: takePhoto },
        { text: 'choose from gallery', onPress: pickAvatar },
        ...(avatar ? [{ text: 'remove', style: 'destructive', onPress: () => setAvatar(null) }] : []),
        { text: 'cancel', style: 'cancel' },
      ]
    );
  };

  const getBase64FromUri = async (uri) => {
    if (Platform.OS === 'web') {
      if (uri.startsWith('data:')) {
        return uri.split(',')[1];
      }
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      return await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !username) {
      Alert.alert('error', 'please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('error', 'please enter a valid email address');
      return;
    }

    if (!validateUsername(username)) {
      Alert.alert(
        'error', 
        'username must be 3-20 characters and contain only letters, numbers, and underscores'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert('error', 'password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('error', 'passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const usernameExists = await api.profiles.usernameExists(username.toLowerCase());

      if (usernameExists) {
        setLoading(false);
        Alert.alert('error', 'username already taken');
        return;
      }

      const { data, error } = await signUp(email, password, username.toLowerCase());

      if (error) {
        setLoading(false);
        Alert.alert('signup failed', error.message);
        return;
      }

      // If we have an avatar and signup was successful, upload it
      // Note: The user needs to verify their email first, so we'll store the avatar
      // preference and upload it when they first sign in, or we can try now
      // For simplicity, we'll show a success message and they can add avatar after verification

      setLoading(false);
      Alert.alert(
        'success!',
        avatar 
          ? 'account created! please check your email to verify your account. you can set your profile photo after signing in.'
          : 'account created! please check your email to verify your account.',
        [{ text: 'ok', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('error', 'something went wrong');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={localStyles.scrollContentCentered}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Theme Toggle */}
          <TouchableOpacity 
            onPress={toggleTheme} 
            style={localStyles.themeToggle}
          >
          <Ionicons
            name={isDarkMode ? "sunny-outline" : "moon-outline"}
            size={24}
            color={colors.icon.primary}
          />
        </TouchableOpacity>

        {/* Back button */}
        <TouchableOpacity 
          style={localStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.icon.primary} />
        </TouchableOpacity>

        {/* Avatar Picker as Logo replacement */}
        <View style={localStyles.avatarSection}>
          <TouchableOpacity 
            style={[localStyles.avatarButton, { borderColor: colors.border }]}
            onPress={showAvatarOptions}
          >
            {avatar ? (
              <Image source={{ uri: avatar.uri }} style={localStyles.avatarImage} />
            ) : (
              <View style={[localStyles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                <Ionicons name="person-add-outline" size={32} color={colors.icon.secondary} />
              </View>
            )}
            <View style={[localStyles.avatarBadge, { backgroundColor: colors.button.primary }]}>
              <Ionicons name="camera" size={14} color={colors.button.primaryText} />
            </View>
          </TouchableOpacity>
          <Text style={styles.title}>create account</Text>
          <Text style={[localStyles.avatarHint, { color: colors.text.tertiary }]}>
            {avatar ? 'tap to change photo' : 'tap to add photo (optional)'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="username"
              placeholderTextColor={colors.input.placeholder}
              value={username}
              onChangeText={(text) => setUsername(text.toLowerCase())}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={[localStyles.helperText, { color: colors.text.tertiary }]}>
              3-20 characters, letters, numbers, and underscores only
            </Text>
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="email"
              placeholderTextColor={colors.input.placeholder}
              value={email}
              onChangeText={setEmail}
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
            <Text style={[localStyles.helperText, { color: colors.text.tertiary }]}>
              minimum 6 characters
            </Text>
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="confirm password"
              placeholderTextColor={colors.input.placeholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoComplete="password"
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                size={18} 
                color={colors.icon.secondary} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={colors.button.primaryText} size="small" />
            ) : (
              <Text style={styles.buttonText}>sign up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>already have an account?</Text>
          </TouchableOpacity>
        </View>
        
        {/* Extra padding for keyboard */}
        <View style={{ height: 40 }} />
      </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const localStyles = {
  scrollContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 32,
    zIndex: 10,
  },
  themeToggle: {
    position: 'absolute',
    top: 60,
    right: 32,
    zIndex: 10,
  },
  helperText: {
    fontSize: 12,
    fontWeight: '300',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarButton: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 16,
    overflow: 'visible',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '300',
  },
};