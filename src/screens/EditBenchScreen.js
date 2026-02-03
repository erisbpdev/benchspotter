import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

const VIEW_TYPES = [
  { value: 'ocean', label: 'ocean', icon: 'water-outline' },
  { value: 'mountain', label: 'mountain', icon: 'triangle-outline' },
  { value: 'urban', label: 'urban', icon: 'business-outline' },
  { value: 'forest', label: 'forest', icon: 'leaf-outline' },
  { value: 'lake', label: 'lake', icon: 'water-outline' },
  { value: 'river', label: 'river', icon: 'water-outline' },
  { value: 'desert', label: 'desert', icon: 'sunny-outline' },
  { value: 'valley', label: 'valley', icon: 'analytics-outline' },
  { value: 'other', label: 'other', icon: 'ellipsis-horizontal-outline' },
];

export default function EditBenchScreen({ route, navigation }) {
  const { bench } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  // Form state
  const [title, setTitle] = useState(bench.title || '');
  const [description, setDescription] = useState(bench.description || '');
  const [viewType, setViewType] = useState(bench.view_type || 'other');
  const [accessibilityNotes, setAccessibilityNotes] = useState(bench.accessibility_notes || '');
  const [saving, setSaving] = useState(false);

  // Photo state
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]); // { uri, base64, mimeType }
  const [photosToDelete, setPhotosToDelete] = useState([]); // photo ids to delete
  const [primaryPhotoId, setPrimaryPhotoId] = useState(null);
  const [newPrimaryIndex, setNewPrimaryIndex] = useState(null); // index in newPhotos array
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  // Check if user is owner
  const isOwner = user && bench && user.id === bench.user_id;

  // Load existing photos
  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const photos = await api.photos.getByBenchId(bench.id);
      setExistingPhotos(photos);
      const primary = photos.find(p => p.is_primary);
      if (primary) {
        setPrimaryPhotoId(primary.id);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for the bench');
      return;
    }

    if (!isOwner) {
      Alert.alert('Error', 'You can only edit your own benches');
      return;
    }

    setSaving(true);

    try {
      // 1. Update bench details
      await api.benches.update(bench.id, user.id, {
        title: title.trim(),
        description: description.trim() || null,
        view_type: viewType,
        accessibility_notes: accessibilityNotes.trim() || null,
      });

      // 2. Delete photos marked for deletion
      for (const photoId of photosToDelete) {
        try {
          await api.photos.delete(photoId);
        } catch (error) {
          console.error('Error deleting photo:', error);
        }
      }

      // 3. Upload new photos
      for (let i = 0; i < newPhotos.length; i++) {
        const photo = newPhotos[i];
        try {
          const isPrimary = newPrimaryIndex === i && photosToDelete.includes(primaryPhotoId);
          await api.photos.upload({
            benchId: bench.id,
            userId: user.id,
            photoData: photo.base64,
            mimeType: photo.mimeType,
            isPrimary,
          });
        } catch (error) {
          console.error('Error uploading photo:', error);
        }
      }

      // 4. Update primary photo if changed (and it's an existing photo)
      const currentPrimary = existingPhotos.find(p => p.is_primary);
      if (primaryPhotoId && currentPrimary?.id !== primaryPhotoId && !photosToDelete.includes(primaryPhotoId)) {
        try {
          await api.photos.setPrimary(primaryPhotoId, bench.id);
        } catch (error) {
          console.error('Error setting primary photo:', error);
        }
      }

      Alert.alert('Saved', 'Bench updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error updating bench:', error);
      Alert.alert('Error', 'Could not update bench. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    const remainingSlots = 5 - (existingPhotos.length - photosToDelete.length + newPhotos.length);
    
    if (remainingSlots <= 0) {
      Alert.alert('Limit Reached', 'Maximum 5 photos per bench');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => ({
        uri: asset.uri,
        base64: asset.base64,
        mimeType: asset.mimeType || 'image/jpeg',
      }));
      setNewPhotos(prev => [...prev, ...newImages]);

      // If no primary and this is first photo, set as primary
      const totalExisting = existingPhotos.length - photosToDelete.length;
      if (totalExisting === 0 && newPhotos.length === 0 && newImages.length > 0) {
        setNewPrimaryIndex(0);
      }
    }
  };

  const takePhoto = async () => {
    const remainingSlots = 5 - (existingPhotos.length - photosToDelete.length + newPhotos.length);
    
    if (remainingSlots <= 0) {
      Alert.alert('Limit Reached', 'Maximum 5 photos per bench');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setNewPhotos(prev => [...prev, {
        uri: asset.uri,
        base64: asset.base64,
        mimeType: asset.mimeType || 'image/jpeg',
      }]);

      // If no primary and this is first photo, set as primary
      const totalExisting = existingPhotos.length - photosToDelete.length;
      if (totalExisting === 0 && newPhotos.length === 0) {
        setNewPrimaryIndex(0);
      }
    }
  };

  const removeExistingPhoto = (photoId) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPhotosToDelete(prev => [...prev, photoId]);
            // If removing primary, reset primary
            if (photoId === primaryPhotoId) {
              const remaining = existingPhotos.filter(p => p.id !== photoId && !photosToDelete.includes(p.id));
              if (remaining.length > 0) {
                setPrimaryPhotoId(remaining[0].id);
              } else if (newPhotos.length > 0) {
                setPrimaryPhotoId(null);
                setNewPrimaryIndex(0);
              } else {
                setPrimaryPhotoId(null);
              }
            }
          },
        },
      ]
    );
  };

  const removeNewPhoto = (index) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
    // Adjust primary index if needed
    if (newPrimaryIndex === index) {
      setNewPrimaryIndex(null);
    } else if (newPrimaryIndex !== null && newPrimaryIndex > index) {
      setNewPrimaryIndex(prev => prev - 1);
    }
  };

  const setExistingAsPrimary = (photoId) => {
    setPrimaryPhotoId(photoId);
    setNewPrimaryIndex(null);
  };

  const setNewAsPrimary = (index) => {
    setNewPrimaryIndex(index);
    setPrimaryPhotoId(null);
  };

  const hasChanges = 
    title !== bench.title ||
    description !== (bench.description || '') ||
    viewType !== bench.view_type ||
    accessibilityNotes !== (bench.accessibility_notes || '') ||
    newPhotos.length > 0 ||
    photosToDelete.length > 0 ||
    (primaryPhotoId !== existingPhotos.find(p => p.is_primary)?.id);

  const visibleExistingPhotos = existingPhotos.filter(p => !photosToDelete.includes(p.id));
  const totalPhotos = visibleExistingPhotos.length + newPhotos.length;

  if (!isOwner) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.icon.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>edit bench</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.icon.muted} />
          <Text style={styles.emptyStateTitle}>not authorized</Text>
          <Text style={styles.emptyStateText}>you can only edit your own benches</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.icon.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>edit bench</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={saving || !hasChanges}
          style={{ opacity: hasChanges ? 1 : 0.5 }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.button.primary} />
          ) : (
            <Text style={[localStyles.saveText, { color: colors.button.primary }]}>save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photos Section */}
          <View style={localStyles.inputGroup}>
            <View style={localStyles.labelRow}>
              <Text style={[localStyles.label, { color: colors.text.secondary }]}>
                photos ({totalPhotos}/5)
              </Text>
              <Text style={[localStyles.labelHint, { color: colors.text.tertiary }]}>
                tap to set primary
              </Text>
            </View>

            {loadingPhotos ? (
              <ActivityIndicator size="small" color={colors.icon.primary} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={localStyles.photosContainer}
              >
                {/* Existing Photos */}
                {visibleExistingPhotos.map((photo) => (
                  <View key={photo.id} style={localStyles.photoWrapper}>
                    <TouchableOpacity
                      style={[
                        localStyles.photoItem,
                        primaryPhotoId === photo.id && localStyles.primaryPhoto,
                        primaryPhotoId === photo.id && { borderColor: colors.button.primary },
                      ]}
                      onPress={() => setExistingAsPrimary(photo.id)}
                    >
                      <Image source={{ uri: photo.photo_url }} style={localStyles.photoImage} />
                      {primaryPhotoId === photo.id && (
                        <View style={[localStyles.primaryBadge, { backgroundColor: colors.button.primary }]}>
                          <Ionicons name="star" size={10} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[localStyles.removeButton, { backgroundColor: colors.destructive }]}
                      onPress={() => removeExistingPhoto(photo.id)}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* New Photos */}
                {newPhotos.map((photo, index) => (
                  <View key={`new-${index}`} style={localStyles.photoWrapper}>
                    <TouchableOpacity
                      style={[
                        localStyles.photoItem,
                        newPrimaryIndex === index && localStyles.primaryPhoto,
                        newPrimaryIndex === index && { borderColor: colors.button.primary },
                      ]}
                      onPress={() => setNewAsPrimary(index)}
                    >
                      <Image source={{ uri: photo.uri }} style={localStyles.photoImage} />
                      {newPrimaryIndex === index && (
                        <View style={[localStyles.primaryBadge, { backgroundColor: colors.button.primary }]}>
                          <Ionicons name="star" size={10} color="#fff" />
                        </View>
                      )}
                      <View style={[localStyles.newBadge, { backgroundColor: colors.success || '#22C55E' }]}>
                        <Text style={localStyles.newBadgeText}>NEW</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[localStyles.removeButton, { backgroundColor: colors.destructive }]}
                      onPress={() => removeNewPhoto(index)}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add Photo Button */}
                {totalPhotos < 5 && (
                  <TouchableOpacity
                    style={[localStyles.addPhotoButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      Alert.alert('Add Photo', 'Choose a source', [
                        { text: 'Camera', onPress: takePhoto },
                        { text: 'Photo Library', onPress: pickImage },
                        { text: 'Cancel', style: 'cancel' },
                      ]);
                    }}
                  >
                    <Ionicons name="add" size={32} color={colors.icon.secondary} />
                    <Text style={[localStyles.addPhotoText, { color: colors.text.tertiary }]}>
                      add
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>

          {/* Title */}
          <View style={localStyles.inputGroup}>
            <Text style={[localStyles.label, { color: colors.text.secondary }]}>title *</Text>
            <TextInput
              style={[localStyles.input, { 
                backgroundColor: colors.surface, 
                color: colors.text.primary,
                borderColor: colors.border,
              }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Give your bench a name"
              placeholderTextColor={colors.input.placeholder}
              maxLength={100}
            />
            <Text style={[localStyles.charCount, { color: colors.text.tertiary }]}>
              {title.length}/100
            </Text>
          </View>

          {/* View Type */}
          <View style={localStyles.inputGroup}>
            <Text style={[localStyles.label, { color: colors.text.secondary }]}>view type</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={localStyles.viewTypeContainer}
            >
              {VIEW_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    localStyles.viewTypeChip,
                    {
                      backgroundColor: viewType === type.value ? colors.button.primary : colors.surface,
                      borderColor: viewType === type.value ? colors.button.primary : colors.border,
                    },
                  ]}
                  onPress={() => setViewType(type.value)}
                >
                  <Ionicons
                    name={type.icon}
                    size={16}
                    color={viewType === type.value ? colors.button.primaryText : colors.text.secondary}
                  />
                  <Text
                    style={[
                      localStyles.viewTypeText,
                      { color: viewType === type.value ? colors.button.primaryText : colors.text.primary },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Description */}
          <View style={localStyles.inputGroup}>
            <Text style={[localStyles.label, { color: colors.text.secondary }]}>description</Text>
            <TextInput
              style={[localStyles.textArea, { 
                backgroundColor: colors.surface, 
                color: colors.text.primary,
                borderColor: colors.border,
              }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe this bench and its view..."
              placeholderTextColor={colors.input.placeholder}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={[localStyles.charCount, { color: colors.text.tertiary }]}>
              {description.length}/500
            </Text>
          </View>

          {/* Accessibility Notes */}
          <View style={localStyles.inputGroup}>
            <Text style={[localStyles.label, { color: colors.text.secondary }]}>
              accessibility notes
            </Text>
            <TextInput
              style={[localStyles.textArea, { 
                backgroundColor: colors.surface, 
                color: colors.text.primary,
                borderColor: colors.border,
                minHeight: 80,
              }]}
              value={accessibilityNotes}
              onChangeText={setAccessibilityNotes}
              placeholder="Add notes about wheelchair access, terrain, etc."
              placeholderTextColor={colors.input.placeholder}
              multiline
              numberOfLines={3}
              maxLength={300}
              textAlignVertical="top"
            />
            <Text style={[localStyles.charCount, { color: colors.text.tertiary }]}>
              {accessibilityNotes.length}/300
            </Text>
          </View>

          {/* Location (read-only) */}
          <View style={localStyles.inputGroup}>
            <Text style={[localStyles.label, { color: colors.text.secondary }]}>location</Text>
            <View style={[localStyles.readOnlyField, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="location-outline" size={18} color={colors.text.tertiary} />
              <Text style={[localStyles.readOnlyText, { color: colors.text.tertiary }]}>
                {bench.latitude.toFixed(6)}, {bench.longitude.toFixed(6)}
              </Text>
              <Ionicons name="lock-closed-outline" size={14} color={colors.text.tertiary} />
            </View>
            <Text style={[localStyles.helperText, { color: colors.text.tertiary }]}>
              Location cannot be changed after creation
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const localStyles = {
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'lowercase',
  },
  labelHint: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  // Photo styles
  photosContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  photoWrapper: {
    position: 'relative',
  },
  photoItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  primaryPhoto: {
    borderWidth: 3,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 11,
    marginTop: 4,
  },
  // Form styles
  input: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  textArea: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 120,
  },
  charCount: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
  },
  viewTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  viewTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  viewTypeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 14,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
};