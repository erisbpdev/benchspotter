import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '../services/supabase';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

export default function MapScreen({ navigation, route }) {
  const [location, setLocation] = useState(null);
  const [benches, setBenches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [focusedBench, setFocusedBench] = useState(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const selectionMarkerRef = useRef(null);

  // Check for focusBench parameter and selectLocation mode
  const focusBench = route?.params?.focusBench;
  const selectLocationMode = route?.params?.selectLocation;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.benchSpotterNavigation = navigation;
    }
  }, [navigation]);

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

      // Fetch all benches globally
      if (focusBench) {
        setFocusedBench(focusBench);
        await fetchAllBenches();
      } else {
        await fetchAllBenches();
      }
      
      setLoading(false);
    })();
  }, [focusBench]);

  useEffect(() => {
    if (!location || mapReady) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      setMapReady(true);
      initMap();
    };
    document.head.appendChild(script);

    return () => {
      if (link.parentNode) link.remove();
      if (script.parentNode) script.remove();
    };
  }, [location]);

  useEffect(() => {
    if (mapReady && location) {
      initMap();
    }
  }, [benches, mapReady, isDarkMode, focusedBench, isSelectingLocation]);

  // Handle focusBench changes (when navigating back with new params)
  useEffect(() => {
    if (focusBench && mapReady && mapRef.current) {
      setFocusedBench(focusBench);
      mapRef.current.setView([focusBench.latitude, focusBench.longitude], 16);
      
      // Fetch all benches globally
      fetchAllBenches();
      
      // Open the popup for the focused bench if it exists
      setTimeout(() => {
        const marker = markersRef.current[focusBench.id];
        if (marker) {
          marker.openPopup();
        }
      }, 500);
    }
  }, [focusBench, mapReady]);

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
    }
  }, []);

  const clearFocus = () => {
    setFocusedBench(null);
    if (location && mapRef.current) {
      mapRef.current.setView([location.latitude, location.longitude], 13);
      fetchAllBenches();
    }
    // Clear the route params
    navigation.setParams({ focusBench: undefined });
  };

  const toggleLocationSelection = () => {
    if (isSelectingLocation) {
      // Cancel selection
      setIsSelectingLocation(false);
      setSelectedLocation(null);
      if (selectionMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(selectionMarkerRef.current);
        selectionMarkerRef.current = null;
      }
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

  const initMap = () => {
    if (!window.L || !location) return;

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    mapElement.innerHTML = '';
    markersRef.current = {};

    // Determine map center - focused bench or user location
    const center = focusedBench 
      ? [focusedBench.latitude, focusedBench.longitude]
      : [location.latitude, location.longitude];
    const zoom = focusedBench ? 16 : 13;

    const map = window.L.map('map').setView(center, zoom);
    mapRef.current = map;

    // Use different tile layer based on theme
    const tileUrl = isDarkMode 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    window.L.tileLayer(tileUrl, {
      attribution: '© OpenStreetMap contributors © CARTO',
    }).addTo(map);

    // Add click handler for location selection
    if (isSelectingLocation) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setSelectedLocation({
          latitude: lat,
          longitude: lng,
        });

        // Remove previous selection marker if exists
        if (selectionMarkerRef.current) {
          map.removeLayer(selectionMarkerRef.current);
        }

        // Add new selection marker
        const selectionIcon = window.L.divIcon({
          className: 'selection-icon',
          html: `
            <div style="
              width: 40px;
              height: 40px;
              background: ${colors.button.primary};
              border: 3px solid ${colors.background};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              box-shadow: 0 0 16px rgba(0,0,0,0.4);
              animation: pulse 1.5s infinite;
            ">📍</div>
            <style>
              @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
              }
            </style>
          `,
          iconSize: [40, 40],
        });

        const marker = window.L.marker([lat, lng], {
          icon: selectionIcon,
        }).addTo(map);

        selectionMarkerRef.current = marker;
      });

      // Change cursor to crosshair
      mapElement.style.cursor = 'crosshair';
    } else {
      mapElement.style.cursor = '';
    }

    // User location marker
    const userIcon = window.L.divIcon({
      className: 'user-location-icon',
      html: `
        <div style="
          width: 16px;
          height: 16px;
          background: ${colors.button.primary};
          border: 2px solid ${colors.background};
          border-radius: 50%;
        "></div>
      `,
      iconSize: [16, 16],
    });

    window.L.marker([location.latitude, location.longitude], { icon: userIcon })
      .addTo(map)
      .bindPopup(`<b style="color: ${colors.text.primary}; background: ${colors.background}; padding: 4px;">you are here</b>`);

    // Bench markers (only show if not in selection mode or if there's a focus)
    if (!isSelectingLocation || focusedBench) {
      benches.forEach((bench) => {
        const isFocused = focusedBench && bench.id === focusedBench.id;
        
        const benchIcon = window.L.divIcon({
          className: 'bench-icon',
          html: `
            <div style="
              width: ${isFocused ? '32px' : '24px'};
              height: ${isFocused ? '32px' : '24px'};
              background: ${isFocused ? colors.button.primary : colors.background};
              border: 2px solid ${colors.button.primary};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${isFocused ? '16px' : '12px'};
              ${isFocused ? 'box-shadow: 0 0 12px rgba(0,0,0,0.3);' : ''}
            ">🪑</div>
          `,
          iconSize: [isFocused ? 32 : 24, isFocused ? 32 : 24],
        });

        const marker = window.L.marker([parseFloat(bench.latitude), parseFloat(bench.longitude)], {
          icon: benchIcon,
        }).addTo(map);

        // Store marker reference
        markersRef.current[bench.id] = marker;

        // Make marker clickable - navigate to bench detail on click
        marker.on('click', () => {
          if (window.benchSpotterNavigation && !isSelectingLocation) {
            window.benchSpotterNavigation.navigate('BenchDetail', { benchId: bench.id });
          }
        });
      });
    }
  };

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
      <div id="map" style={{ width: '100%', height: '100%', zIndex: 1 }} />

      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Show focused bench info, selection mode, or normal counter */}
          {isSelectingLocation ? (
            <View style={[localStyles.selectionBadge, { 
              backgroundColor: colors.button.primary,
            }]}>
              <Ionicons name="pin" size={16} color={colors.button.primaryText} />
              <Text style={[localStyles.selectionText, { color: colors.button.primaryText }]}>
                {selectedLocation ? 'Location selected' : 'Tap map to select location'}
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
                  
                  if (mapRef.current) {
                    mapRef.current.setView([loc.latitude, loc.longitude], 13);
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