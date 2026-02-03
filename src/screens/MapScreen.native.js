import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '../services/supabase';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

export default function MapScreen({ navigation, route }) {
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [benches, setBenches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [focusedBench, setFocusedBench] = useState(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const mapRef = useRef(null);

  // Check for focusBench parameter and selectLocation mode
  const focusBench = route?.params?.focusBench;
  const selectLocationMode = route?.params?.selectLocation;

  useEffect(() => {
    // Enable selection mode if parameter is passed
    if (selectLocationMode) {
      setIsSelectingLocation(true);
    }
  }, [selectLocationMode]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('permission denied', 'location access required');
        setLoading(false);
        return;
      }

      let userLocation = await Location.getCurrentPositionAsync({});
      const loc = {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      };
      setLocation(loc);

      // If we have a focusBench, center on it
      if (focusBench) {
        setFocusedBench(focusBench);
        setMapRegion({
          latitude: focusBench.latitude,
          longitude: focusBench.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        await fetchAllBenches();
      } else {
        setMapRegion({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        await fetchAllBenches();
      }

      setLoading(false);
    })();
  }, [focusBench]);

  // Handle focusBench changes
  useEffect(() => {
    if (focusBench && mapRef.current) {
      setFocusedBench(focusBench);
      const newRegion = {
        latitude: focusBench.latitude,
        longitude: focusBench.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 1000);
      fetchAllBenches();
    }
  }, [focusBench]);

  // Real-time subscription for new benches
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('benches-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'benches',
        },
        (payload) => {
          console.log('New bench added!', payload.new);
          setBenches((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchAllBenches = useCallback(async () => {
    try {
      const data = await api.benches.getAll();
      setBenches(data);
    } catch (error) {
      console.error('Error fetching benches:', error);
      Alert.alert('error', 'could not load benches');
    }
  }, []);

  const clearFocus = () => {
    setFocusedBench(null);
    if (location && mapRef.current) {
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setMapRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 1000);
      fetchAllBenches();
    }
    navigation.setParams({ focusBench: undefined });
  };

  const toggleLocationSelection = () => {
    if (isSelectingLocation) {
      // Cancel selection
      setIsSelectingLocation(false);
      setSelectedLocation(null);
    } else {
      // Start selection
      setIsSelectingLocation(true);
      Alert.alert(
        'Select Location',
        'Tap anywhere on the map to select a location for your bench'
      );
    }
  };

  const confirmLocationSelection = () => {
    if (selectedLocation) {
      navigation.navigate('AddBench', { location: selectedLocation });
      setIsSelectingLocation(false);
      setSelectedLocation(null);
    }
  };

  const handleMapPress = (event) => {
    if (isSelectingLocation) {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      setSelectedLocation({ latitude, longitude });
    }
  };

  // Dynamic map style based on theme
  const mapStyle = isDarkMode ? darkMapStyle : lightMapStyle;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.icon.primary} />
        <Text style={styles.loadingText}>finding benches...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="location-outline" size={48} color={colors.icon.secondary} />
        <Text style={styles.errorText}>location access required</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation
        showsMyLocationButton={!isSelectingLocation}
        customMapStyle={mapStyle}
        onPress={handleMapPress}
      >
        {/* Bench markers (hide in selection mode unless there's a focus) */}
        {(!isSelectingLocation || focusedBench) && benches.map((bench) => {
          const isFocused = focusedBench && bench.id === focusedBench.id;
          return (
            <Marker
              key={bench.id}
              coordinate={{
                latitude: parseFloat(bench.latitude),
                longitude: parseFloat(bench.longitude),
              }}
              pinColor={isFocused ? colors.button.primary : undefined}
              onPress={() => {
                if (!isSelectingLocation) {
                  navigation.navigate('BenchDetail', { benchId: bench.id });
                }
              }}
            />
          );
        })}

        {/* Selection marker */}
        {isSelectingLocation && selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            pinColor={colors.button.primary}
            title="Selected Location"
          />
        )}
      </MapView>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Show selection mode, focused bench info, or normal counter */}
          {isSelectingLocation ? (
            <View style={[localStyles.selectionBadge, { 
              backgroundColor: colors.button.primary,
            }]}>
              <Ionicons name="pin" size={16} color={colors.button.primaryText} />
              <Text style={[localStyles.selectionText, { color: colors.button.primaryText }]}>
                {selectedLocation ? 'Location selected' : 'Tap map to select'}
              </Text>
            </View>
          ) : focusedBench ? (
            <TouchableOpacity 
              style={[localStyles.focusBadge, { 
                backgroundColor: colors.card.background,
                borderColor: colors.border,
              }]}
              onPress={clearFocus}
            >
              <Ionicons name="location" size={16} color={colors.button.primary} />
              <Text style={[localStyles.focusText, { color: colors.text.primary }]} numberOfLines={1}>
                {focusedBench.title}
              </Text>
              <Ionicons name="close-circle" size={18} color={colors.icon.secondary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.counterContainer}>
              <Text style={styles.counterText}>
                {benches.length} {benches.length !== 1 ? 'benches' : 'bench'}
              </Text>
            </View>
          )}
          
          {!isSelectingLocation && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={async () => {
                try {
                  const userLocation = await Location.getCurrentPositionAsync({});
                  const loc = {
                    latitude: userLocation.coords.latitude,
                    longitude: userLocation.coords.longitude,
                  };
                  setLocation(loc);
                  
                  const newRegion = {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  };
                  setMapRegion(newRegion);
                  
                  if (mapRef.current) {
                    mapRef.current.animateToRegion(newRegion, 1000);
                  }
                  
                  // Clear focus and fetch all benches globally
                  setFocusedBench(null);
                  navigation.setParams({ focusBench: undefined });
                  await fetchAllBenches();
                } catch (error) {
                  console.error('Error getting location:', error);
                  Alert.alert('Error', 'Could not get your location');
                }
              }}
            >
              <Ionicons name="locate-outline" size={20} color={colors.icon.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Location Selection Controls */}
      {isSelectingLocation && (
        <View style={[localStyles.selectionControls, { backgroundColor: colors.card.background }]}>
          <TouchableOpacity
            style={[localStyles.cancelButton, { 
              backgroundColor: colors.background,
              borderColor: colors.border,
            }]}
            onPress={toggleLocationSelection}
          >
            <Text style={[localStyles.cancelButtonText, { color: colors.text.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[localStyles.confirmButton, { 
              backgroundColor: selectedLocation ? colors.button.primary : colors.border,
            }]}
            onPress={confirmLocationSelection}
            disabled={!selectedLocation}
            activeOpacity={0.8}
          >
            <Text style={[localStyles.confirmButtonText, { 
              color: selectedLocation ? colors.button.primaryText : colors.text.tertiary,
            }]}>
              Confirm Location
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Button */}
      {!isSelectingLocation && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddBench', { location })}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.button.primaryText} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const localStyles = {
  focusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    maxWidth: 220,
  },
  focusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  selectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  selectionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectionControls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
};

// Dark map style
const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6B7280' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#262626' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6B7280' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0A0A0A' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#262626' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0A0A0A' }],
  },
];

// Light map style
const lightMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#f5f5f5' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#E5E7EB' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#E8F5E9' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#E5E7EB' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#E3F2FD' }],
  },
];