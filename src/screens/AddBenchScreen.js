import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

// Import extracted components
import FormInput from '../components/FormInput';
import ViewTypeSelector from '../components/ViewTypeSelector';
import LocationDisplay from '../components/LocationDisplay';

// Maximum number of photos allowed
const MAX_PHOTOS = 5;

export default function AddBenchScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [viewType, setViewType] = useState('ocean');
  const [accessibilityNotes, setAccessibilityNotes] = useState('');
  const [location, setLocation] = useState(route.params?.location || null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Update location when route params change (coming back from map selection)
  useEffect(() => {
    if (route.params?.location) {
      setLocation(route.params.location);
    }
  }, [route.params?.location]);

  useEffect(() => {
    if (!location) {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required');
        return;
      }

      let userLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location');
    }
  };

  const selectLocationOnMap = () => {
    // Navigate to MainTabs > Explore with selectLocation parameter
    navigation.navigate('MainTabs', {
      screen: 'Explore',
      params: { selectLocation: true },
    });
  };

  const pickImage = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limit reached', `Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera roll permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPhotos(prev => [...prev, {
          uri: asset.uri,
          base64: asset.base64,
          mimeType: asset.mimeType || 'image/jpeg',
        }]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not pick image');
    }
  }, [photos.length]);

  const takePhoto = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limit reached', `Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPhotos(prev => [...prev, {
          uri: asset.uri,
          base64: asset.base64,
          mimeType: asset.mimeType || 'image/jpeg',
        }]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Could not take photo');
    }
  }, [photos.length]);

  const removePhoto = useCallback((index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getBase64FromUri = async (uri) => {
    if (Platform.OS === 'web') {
      if (uri.startsWith('data:')) {
        return uri.split(',')[1];
      }
      
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUri = reader.result;
            resolve(dataUri.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error converting to base64:', error);
        throw error;
      }
    } else {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location is required');
      return;
    }

    setLoading(true);

    try {
      // Create the bench using API service
      const bench = await api.benches.create({
        userId: user.id,
        title: title.trim(),
        description: description.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        viewType,
        accessibilityNotes: accessibilityNotes.trim(),
      });

      // Upload photos if any
      if (photos.length > 0) {
        setUploadProgress('Uploading photos...');
        
        // Prepare photos with base64 data
        const photosToUpload = await Promise.all(
          photos.map(async (photo, index) => {
            let base64 = photo.base64;
            if (!base64) {
              base64 = await getBase64FromUri(photo.uri);
            }
            return {
              base64,
              mimeType: photo.mimeType || 'image/jpeg',
            };
          })
        );

        await api.photos.uploadMultiple({
          benchId: bench.id,
          userId: user.id,
          photos: photosToUpload,
        });
      }

      Alert.alert('Success!', 'Bench added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error adding bench:', error);
      Alert.alert('Error', 'Could not add bench. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.icon.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>add bench</Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Ionicons
            name={isDarkMode ? "sunny-outline" : "moon-outline"}
            size={20}
            color={colors.icon.primary}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Photo Section */}
            <View style={localStyles.photoSection}>
              <View style={localStyles.photoHeader}>
                <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>
                  photos ({photos.length}/{MAX_PHOTOS})
                </Text>
                {photos.length > 0 && (
                  <Text style={[localStyles.primaryHint, { color: colors.text.secondary }]}>
                    first photo is cover
                  </Text>
                )}
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={localStyles.photoScroll}
                contentContainerStyle={localStyles.photoScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {photos.map((photo, index) => (
                  <View key={index} style={localStyles.photoContainer}>
                    <Image source={{ uri: photo.uri }} style={localStyles.photoPreview} />
                    {index === 0 && (
                      <View style={[localStyles.primaryBadge, { backgroundColor: colors.button.primary }]}>
                        <Text style={[localStyles.primaryBadgeText, { color: colors.button.primaryText }]}>
                          cover
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[localStyles.removePhotoButton, { backgroundColor: colors.destructive }]}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {photos.length < MAX_PHOTOS && (
                  <View style={localStyles.addButtonsContainer}>
                    <TouchableOpacity
                      style={[localStyles.addPhotoButton, { 
                        backgroundColor: colors.card.background,
                        borderColor: colors.border,
                      }]}
                      onPress={pickImage}
                    >
                      <Ionicons name="images-outline" size={24} color={colors.icon.secondary} />
                      <Text style={[localStyles.addPhotoText, { color: colors.text.secondary }]}>
                        gallery
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[localStyles.addPhotoButton, { 
                        backgroundColor: colors.card.background,
                        borderColor: colors.border,
                      }]}
                      onPress={takePhoto}
                    >
                      <Ionicons name="camera-outline" size={24} color={colors.icon.secondary} />
                      <Text style={[localStyles.addPhotoText, { color: colors.text.secondary }]}>
                        camera
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <FormInput
                placeholder="title"
                value={title}
                onChangeText={setTitle}
              />

              <FormInput
                placeholder="description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <ViewTypeSelector
                selectedValue={viewType}
                onValueChange={setViewType}
              />

              {/* Enhanced Location Display with Map Selection */}
              <View style={localStyles.locationSection}>
                <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>location</Text>
                
                <LocationDisplay
                  location={location}
                  onRefresh={getCurrentLocation}
                />

                <TouchableOpacity
                  style={[localStyles.selectMapButton, {
                    backgroundColor: colors.card.background,
                    borderColor: colors.border,
                  }]}
                  onPress={selectLocationOnMap}
                >
                  <Ionicons name="map-outline" size={20} color={colors.icon.primary} />
                  <Text style={[localStyles.selectMapButtonText, { color: colors.text.primary }]}>
                    Select location on map
                  </Text>
                </TouchableOpacity>
              </View>

              <FormInput
                placeholder="accessibility notes (optional)"
                value={accessibilityNotes}
                onChangeText={setAccessibilityNotes}
              />

              {uploadProgress ? (
                <View style={localStyles.progressContainer}>
                  <ActivityIndicator size="small" color={colors.icon.primary} />
                  <Text style={[localStyles.progressText, { color: colors.text.secondary }]}>
                    {uploadProgress}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color={colors.button.primaryText} size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>add bench</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Extra padding for keyboard */}
            <View style={{ height: 100 }} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const localStyles = {
  photoSection: {
    margin: 20,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  primaryHint: {
    fontSize: 12,
    opacity: 0.6,
  },
  photoScroll: {
    flexGrow: 0,
  },
  photoScrollContent: {
    paddingRight: 16,
    gap: 12,
    flexDirection: 'row',
  },
  photoContainer: {
    position: 'relative',
    width: 120,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  primaryBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  addPhotoButton: {
    width: 100,
    height: 90,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  addPhotoText: {
    fontSize: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  progressText: {
    fontSize: 14,
  },
  locationSection: {
    marginBottom: 16,
  },
  selectMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    gap: 8,
  },
  selectMapButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
};