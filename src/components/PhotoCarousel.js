import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Modal,
  StatusBar,
  SafeAreaView,
  Text
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

function PhotoCarousel({ photos }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const scrollViewRef = useRef(null);
  const modalScrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  // Memoize photos array to prevent unnecessary re-renders
  const memoizedPhotos = useMemo(() => photos || [], [photos]);

  if (!memoizedPhotos || memoizedPhotos.length === 0) {
    return null;
  }

  // Optimized scroll handler with debouncing built into scrollEventThrottle
  const handleScroll = useCallback((event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    
    if (roundIndex !== currentIndex) {
      setCurrentIndex(roundIndex);
    }
  }, [currentIndex]);

  // Open modal at the correct photo index
  const handlePhotoPress = useCallback((index) => {
    setModalIndex(index);
    setModalVisible(true);
    
    // Scroll to the correct photo when modal opens
    setTimeout(() => {
      modalScrollViewRef.current?.scrollTo({
        x: index * screenWidth,
        animated: false
      });
    }, 100);
  }, []);

  // Optimized modal scroll handler
  const handleModalScroll = useCallback((event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    
    if (roundIndex !== modalIndex) {
      setModalIndex(roundIndex);
    }
  }, [modalIndex]);

  // Close modal handler
  const closeModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  // Memoized photo renderer
  const renderPhoto = useCallback((photo, index, isModal = false) => (
    <TouchableOpacity
      key={`${photo.id}-${isModal ? 'modal' : 'carousel'}`}
      activeOpacity={isModal ? 1 : 0.9}
      onPress={() => !isModal && handlePhotoPress(index)}
      style={[
        isModal ? styles.modalPhotoContainer : styles.photoContainer,
        isModal && { justifyContent: 'center', alignItems: 'center' }
      ]}
      accessible={true}
      accessibilityLabel={`Photo ${index + 1} of ${memoizedPhotos.length}`}
      accessibilityRole="imagebutton"
    >
      <Image
        source={{ uri: photo.photo_url }}
        style={isModal ? styles.modalPhoto : styles.photo}
        resizeMode={isModal ? "contain" : "cover"}
      />
    </TouchableOpacity>
  ), [handlePhotoPress, memoizedPhotos.length, styles]);

  // Memoized indicators
  const indicators = useMemo(() => {
    if (memoizedPhotos.length <= 1) return null;
    
    return (
      <View style={styles.indicatorContainer}>
        {memoizedPhotos.map((_, index) => (
          <View
            key={`indicator-${index}`}
            style={[
              styles.indicator,
              index === currentIndex && styles.indicatorActive,
            ]}
          />
        ))}
      </View>
    );
  }, [memoizedPhotos.length, currentIndex, styles]);

  return (
    <>
      <View style={styles.photosSection}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.photoScrollView}
          decelerationRate="fast"
          snapToInterval={screenWidth}
          snapToAlignment="center"
          removeClippedSubviews={true} // Performance optimization
          accessible={true}
          accessibilityLabel="Photo carousel"
        >
          {memoizedPhotos.map((photo, index) => renderPhoto(photo, index))}
        </ScrollView>

        {indicators}
      </View>

      {/* Full Screen Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
        statusBarTranslucent={true}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={closeModal}
              style={styles.modalCloseButton}
              accessible={true}
              accessibilityLabel="Close photo viewer"
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.modalIndicator}>
              <Text style={styles.modalCounter}>
                {modalIndex + 1} / {memoizedPhotos.length}
              </Text>
            </View>
          </View>

          {/* Modal Photo Gallery */}
          <ScrollView
            ref={modalScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleModalScroll}
            scrollEventThrottle={16}
            style={styles.modalScrollView}
            decelerationRate="fast"
            snapToInterval={screenWidth}
            snapToAlignment="center"
            removeClippedSubviews={true}
            accessible={true}
            accessibilityLabel="Full screen photo viewer"
          >
            {memoizedPhotos.map((photo, index) => renderPhoto(photo, index, true))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

// Memoize to prevent re-renders when parent updates but photos haven't changed
export default React.memo(PhotoCarousel, (prevProps, nextProps) => {
  // Custom comparison - only re-render if photos array actually changed
  if (prevProps.photos === nextProps.photos) return true;
  if (!prevProps.photos || !nextProps.photos) return false;
  if (prevProps.photos.length !== nextProps.photos.length) return false;

  // Compare photo IDs
  return prevProps.photos.every((photo, index) =>
    photo.id === nextProps.photos[index]?.id
  );
});