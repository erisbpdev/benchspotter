import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

const { width } = Dimensions.get('window');

export default function PhotoPicker({
  photos,
  onPickImage,
  onTakePhoto,
  onRemovePhoto
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  if (photos && photos.length > 0) {
    return (
      <View style={styles.photoSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectedPhotosContainer}
        >
          {photos.map((photo, index) => (
            <View key={index} style={styles.selectedPhotoContainer}>
              <Image source={{ uri: photo.uri }} style={styles.selectedPhoto} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => onRemovePhoto(index)}
              >
                <Ionicons name="close-circle" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add more photos button */}
          <TouchableOpacity style={styles.addMoreButton} onPress={onPickImage}>
            <Ionicons name="add" size={32} color={colors.icon.secondary} />
            <Text style={styles.addMoreText}>Add photo</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.photoActions}>
          <TouchableOpacity style={styles.photoActionButton} onPress={onTakePhoto}>
            <Text style={styles.photoActionText}>Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.photoPlaceholder}>
      <Ionicons name="camera-outline" size={32} color={colors.icon.secondary} />
      <Text style={styles.photoPlaceholderText}>add photos</Text>
      <View style={styles.photoButtons}>
        <TouchableOpacity style={styles.photoButton} onPress={onTakePhoto}>
          <Text style={styles.photoButtonText}>camera</Text>
        </TouchableOpacity>
        <Text style={styles.photoDivider}>or</Text>
        <TouchableOpacity style={styles.photoButton} onPress={onPickImage}>
          <Text style={styles.photoButtonText}>gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}