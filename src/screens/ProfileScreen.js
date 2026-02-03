import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';
import KeyboardAwareModal from '../components/KeyboardAwareModal';
import ThemeSelector from '../components/ThemeSelector';

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  
  const [profile, setProfile] = useState(null);
  const [userBenches, setUserBenches] = useState([]);
  const [stats, setStats] = useState({
    benchesAdded: 0,
    ratingsGiven: 0,
    commentsPosted: 0,
    favorites: 0,
    followers: 0,
    following: 0,
  });
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedAvatar, setEditedAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      const [profileData, benchesData, statsData] = await Promise.all([
        api.profiles.getById(user.id),
        api.benches.getByUserId(user.id),
        api.profiles.getStats(user.id),
      ]);

      setProfile(profileData);
      setEditedName(profileData?.full_name || '');
      setEditedBio(profileData?.bio || '');
      setUserBenches(benchesData);
      setStats(statsData);

      // Fetch unread notification count
      try {
        const unreadCount = await api.notifications.getUnreadCount(user.id);
        setUnreadNotifications(unreadCount);
      } catch (e) {
        // Notifications might not be set up yet
        console.log('Could not fetch notifications count');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Could not load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user, fetchProfileData]);

  // Refresh notification count when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user) {
        api.notifications.getUnreadCount(user.id)
          .then(count => setUnreadNotifications(count))
          .catch(() => {});
      }
    });
    return unsubscribe;
  }, [navigation, user]);

  const openEditModal = () => {
    setEditedName(profile?.full_name || '');
    setEditedBio(profile?.bio || '');
    setEditedAvatar(null);
    setEditModalVisible(true);
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
        setEditedAvatar({
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

  const takeAvatarPhoto = async () => {
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
        setEditedAvatar({
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
      'change profile photo',
      'choose an option',
      [
        { text: 'take photo', onPress: takeAvatarPhoto },
        { text: 'choose from gallery', onPress: pickAvatar },
        ...(profile?.avatar_url || editedAvatar ? [{ 
          text: 'remove photo', 
          style: 'destructive',
          onPress: () => setEditedAvatar({ remove: true }) 
        }] : []),
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

  const handleSaveProfile = async () => {
    setSaving(true);

    try {
      if (editedAvatar) {
        if (editedAvatar.remove) {
          if (profile?.avatar_url) {
            await api.profiles.deleteAvatar(profile.avatar_url);
          }
          await api.profiles.update(user.id, { avatarUrl: null });
        } else {
          setUploadingAvatar(true);
          let base64 = editedAvatar.base64;
          if (!base64) {
            base64 = await getBase64FromUri(editedAvatar.uri);
          }
          await api.profiles.uploadAvatar(user.id, base64, editedAvatar.mimeType);
          setUploadingAvatar(false);
        }
      }

      await api.profiles.update(user.id, {
        fullName: editedName,
        bio: editedBio,
      });

      await fetchProfileData();
      setEditModalVisible(false);
      setEditedAvatar(null);
      Alert.alert('success', 'profile updated');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('error', 'could not update profile');
    } finally {
      setSaving(false);
      setUploadingAvatar(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'sign out',
      'are you sure?',
      [
        { text: 'cancel', style: 'cancel' },
        {
          text: 'sign out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('error', 'could not sign out');
            }
          },
        },
      ]
    );
  };

  const getModalAvatarSource = () => {
    if (editedAvatar?.remove) return null;
    if (editedAvatar?.uri) return { uri: editedAvatar.uri };
    if (profile?.avatar_url) return { uri: profile.avatar_url };
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.icon.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.icon.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>profile</Text>
        <View style={localStyles.headerRight}>
          {/* Notifications Bell */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('Notifications')}
            style={localStyles.bellButton}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.icon.primary} />
            {unreadNotifications > 0 && (
              <View style={[localStyles.notificationBadge, { backgroundColor: colors.destructive }]}>
                <Text style={localStyles.notificationBadgeText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {/* Theme Toggle */}
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons
              name={isDarkMode ? "sunny-outline" : "moon-outline"}
              size={20}
              color={colors.icon.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[localStyles.avatarContainer, { borderColor: colors.border }]}
            onPress={openEditModal}
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={localStyles.avatarImage} />
            ) : (
              <View style={[styles.avatar, localStyles.avatarPlaceholder]}>
                <Ionicons name="person-outline" size={40} color={colors.icon.secondary} />
              </View>
            )}
            <View style={[localStyles.editAvatarBadge, { backgroundColor: colors.button.primary }]}>
              <Ionicons name="camera" size={12} color={colors.button.primaryText} />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.username}>@{profile?.username}</Text>
          
          {profile?.full_name && (
            <Text style={styles.fullName}>{profile.full_name}</Text>
          )}
          
          {profile?.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}

          <TouchableOpacity 
            style={styles.editButton} 
            onPress={openEditModal}
          >
            <Text style={styles.editButtonText}>edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats - with clickable followers/following */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.benchesAdded}</Text>
              <Text style={styles.statLabel}>benches</Text>
            </View>

            <View style={styles.statDivider} />

            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => navigation.navigate('FollowList', { 
                userId: user.id, 
                username: profile?.username, 
                type: 'followers' 
              })}
            >
              <Text style={styles.statValue}>{stats.followers}</Text>
              <Text style={styles.statLabel}>followers</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => navigation.navigate('FollowList', { 
                userId: user.id, 
                username: profile?.username, 
                type: 'following' 
              })}
            >
              <Text style={styles.statValue}>{stats.following}</Text>
              <Text style={styles.statLabel}>following</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.favorites}</Text>
              <Text style={styles.statLabel}>favorites</Text>
            </View>
          </View>
        </View>

        {/* Theme Selector */}
        <ThemeSelector />
          
        {/* Your Benches */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>your benches ({userBenches.length})</Text>

          {userBenches.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>no benches added yet</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Explore' })}
              >
                <Text style={styles.actionButtonText}>add first bench</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.benchesList}>
              {userBenches.map((bench) => {
                const primaryPhoto = bench.bench_photos?.find(p => p.is_primary);
                return (
                  <TouchableOpacity
                    key={bench.id}
                    style={styles.benchCard}
                    onPress={() => navigation.navigate('BenchDetail', { benchId: bench.id })}
                  >
                    {primaryPhoto ? (
                      <Image
                        source={{ uri: primaryPhoto.photo_url }}
                        style={styles.benchImage}
                      />
                    ) : (
                      <View style={styles.benchImagePlaceholder}>
                        <Ionicons name="image-outline" size={24} color={colors.icon.muted} />
                      </View>
                    )}
                    <View style={styles.benchInfo}>
                      <Text style={styles.benchViewType}>{bench.view_type}</Text>
                      <Text style={styles.benchTitle}>{bench.title}</Text>
                      {bench.description && (
                        <Text style={styles.benchDescription} numberOfLines={2}>
                          {bench.description}
                        </Text>
                      )}
                      <Text style={styles.benchDate}>
                        {new Date(bench.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>sign out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Edit Modal */}
      <KeyboardAwareModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        scrollable={false}
      >
        <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ maxHeight: '90%' }}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>edit profile</Text>
                  <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.icon.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.modalBody} 
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Avatar Editor */}
                  <View style={localStyles.avatarEditorContainer}>
                    <TouchableOpacity 
                      style={[localStyles.avatarEditorButton, { borderColor: colors.border }]}
                      onPress={showAvatarOptions}
                    >
                      {getModalAvatarSource() ? (
                        <Image source={getModalAvatarSource()} style={localStyles.avatarEditorImage} />
                      ) : (
                        <View style={[localStyles.avatarEditorPlaceholder, { backgroundColor: colors.surface }]}>
                          <Ionicons name="person-outline" size={32} color={colors.icon.secondary} />
                        </View>
                      )}
                      <View style={[localStyles.avatarEditorBadge, { backgroundColor: colors.button.primary }]}>
                        <Ionicons name="camera" size={14} color={colors.button.primaryText} />
                      </View>
                    </TouchableOpacity>
                    <Text style={[localStyles.avatarHint, { color: colors.text.tertiary }]}>
                      tap to change photo
                    </Text>
                  </View>

                  <Text style={styles.inputLabel}>full name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="your name"
                    placeholderTextColor={colors.input.placeholder}
                    value={editedName}
                    onChangeText={setEditedName}
                  />

                  <Text style={styles.inputLabel}>bio</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="tell us about yourself..."
                    placeholderTextColor={colors.input.placeholder}
                    value={editedBio}
                    onChangeText={setEditedBio}
                    multiline
                    numberOfLines={4}
                  />

                  <Text style={styles.inputLabel}>username</Text>
                  <View style={styles.disabledInput}>
                    <Text style={styles.disabledInputText}>@{profile?.username}</Text>
                  </View>
                  <Text style={styles.helperText}>username cannot be changed</Text>
                  
                  <View style={{ height: 20 }} />
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <View style={localStyles.savingContainer}>
                        <ActivityIndicator color={colors.button.primaryText} size="small" />
                        {uploadingAvatar && (
                          <Text style={[localStyles.savingText, { color: colors.button.primaryText }]}>
                            uploading...
                          </Text>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.saveButtonText}>save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </KeyboardAwareModal>
    </View>
  );
}

const localStyles = {
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bellButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  avatarContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    alignSelf: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditorContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarEditorButton: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'visible',
  },
  avatarEditorImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarEditorPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditorBadge: {
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
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingText: {
    fontSize: 12,
    fontWeight: '400',
  },
};