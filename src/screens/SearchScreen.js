import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';
import KeyboardAwareModal from '../components/KeyboardAwareModal';

// Import extracted components
import SearchInput from '../components/SearchInput';
import SearchFilters from '../components/SearchFilters';
import SearchResultCard from '../components/SearchResultCard';

// OpenStreetMap Nominatim API for geocoding
const geocodeLocation = async (query) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      { headers: { 'User-Agent': 'BenchSpotter/1.0' } }
    );
    const data = await response.json();
    return data.map(item => ({
      name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type,
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
};

export default function SearchScreen({ navigation }) {
  const { user: currentUser } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('benches');
  
  // Bench search state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState(null);
  const [ratingFilter, setRatingFilter] = useState(null);
  const [distanceFilter, setDistanceFilter] = useState(null);
  const [sortBy, setSortBy] = useState('distance');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // User search state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [followingStatus, setFollowingStatus] = useState({});
  
  // Location exploration state
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (location && activeTab === 'benches') {
      performSearch();
    }
  }, [searchQuery, viewType, ratingFilter, distanceFilter, sortBy, location, activeTab]);

  // User search with debounce
  useEffect(() => {
    if (activeTab !== 'users') return;
    
    const debounceTimer = setTimeout(() => {
      if (userSearchQuery.trim().length >= 2) {
        searchUsers();
      } else {
        setUserResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [userSearchQuery, activeTab]);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let userLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        });
        setSelectedLocationName(null);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const processedBenches = await api.benches.search({
        query: searchQuery,
        viewType,
        ratingFilter,
        maxDistance: distanceFilter,
        sortBy,
        userLocation: location,
      });
      setResults(processedBenches);
    } catch (error) {
      console.error('Error searching benches:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, viewType, ratingFilter, distanceFilter, sortBy, location]);

  const searchUsers = async () => {
    setUserLoading(true);
    try {
      const users = await api.profiles.search(userSearchQuery);
      setUserResults(users);

      if (currentUser) {
        const statusMap = {};
        for (const profile of users) {
          if (profile.id !== currentUser.id) {
            const isFollowing = await api.follows.isFollowing(currentUser.id, profile.id);
            statusMap[profile.id] = isFollowing;
          }
        }
        setFollowingStatus(statusMap);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setUserLoading(false);
    }
  };

  const handleFollowToggle = async (profileId) => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to follow users');
      return;
    }
    try {
      const newStatus = await api.follows.toggle(currentUser.id, profileId);
      setFollowingStatus(prev => ({ ...prev, [profileId]: newStatus }));
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Could not update follow status');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setViewType(null);
    setRatingFilter(null);
    setDistanceFilter(null);
    setSortBy('distance');
  };

  const searchLocation = async () => {
    if (!locationQuery.trim()) return;
    setSearchingLocation(true);
    const results = await geocodeLocation(locationQuery);
    setLocationResults(results);
    setSearchingLocation(false);
    if (results.length === 0) {
      Alert.alert('No results', 'Could not find that location.');
    }
  };

  const selectLocation = (loc) => {
    setLocation({ latitude: loc.latitude, longitude: loc.longitude });
    setSelectedLocationName(loc.name.split(',').slice(0, 2).join(',').trim());
    setLocationModalVisible(false);
    setLocationQuery('');
    setLocationResults([]);
  };

  const resetToMyLocation = () => {
    getCurrentLocation();
    setLocationModalVisible(false);
    setLocationQuery('');
    setLocationResults([]);
  };

  const hasActiveFilters = viewType || ratingFilter || searchQuery.trim();

  const renderUserItem = ({ item }) => {
    const isCurrentUser = currentUser && item.id === currentUser.id;
    const isFollowing = followingStatus[item.id];

    return (
      <TouchableOpacity
        style={[localStyles.userItem, { borderBottomColor: colors.border }]}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      >
        <View style={localStyles.userAvatarContainer}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={localStyles.userAvatar} />
          ) : (
            <View style={[localStyles.userAvatarPlaceholder, { backgroundColor: colors.surface }]}>
              <Ionicons name="person" size={20} color={colors.icon.secondary} />
            </View>
          )}
        </View>

        <View style={localStyles.userInfo}>
          <Text style={[localStyles.username, { color: colors.text.primary }]}>
            @{item.username}
          </Text>
          {item.full_name && (
            <Text style={[localStyles.fullName, { color: colors.text.secondary }]}>
              {item.full_name}
            </Text>
          )}
        </View>

        {currentUser && !isCurrentUser && (
          <TouchableOpacity
            style={[localStyles.followButton, {
              backgroundColor: isFollowing ? colors.background : colors.button.primary,
              borderColor: colors.button.primary,
              borderWidth: isFollowing ? 1 : 0,
            }]}
            onPress={() => handleFollowToggle(item.id)}
          >
            <Text style={[localStyles.followButtonText, {
              color: isFollowing ? colors.text.primary : colors.button.primaryText,
            }]}>
              {isFollowing ? 'following' : 'follow'}
            </Text>
          </TouchableOpacity>
        )}

        {isCurrentUser && (
          <View style={[localStyles.youBadge, { backgroundColor: colors.surface }]}>
            <Text style={[localStyles.youBadgeText, { color: colors.text.tertiary }]}>you</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>search</Text>
        {activeTab === 'benches' && (
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
            <Ionicons 
              name={showFilters ? "close" : "options-outline"} 
              size={24} 
              color={colors.icon.primary} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Switcher */}
      <View style={[localStyles.tabContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[localStyles.tab, activeTab === 'benches' && [localStyles.tabActive, { borderBottomColor: colors.button.primary }]]}
          onPress={() => setActiveTab('benches')}
        >
          <Ionicons name="cafe-outline" size={18} color={activeTab === 'benches' ? colors.button.primary : colors.text.tertiary} />
          <Text style={[localStyles.tabText, { color: activeTab === 'benches' ? colors.button.primary : colors.text.tertiary }]}>
            benches
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[localStyles.tab, activeTab === 'users' && [localStyles.tabActive, { borderBottomColor: colors.button.primary }]]}
          onPress={() => setActiveTab('users')}
        >
          <Ionicons name="people-outline" size={18} color={activeTab === 'users' ? colors.button.primary : colors.text.tertiary} />
          <Text style={[localStyles.tabText, { color: activeTab === 'users' ? colors.button.primary : colors.text.tertiary }]}>
            users
          </Text>
        </TouchableOpacity>
      </View>

      {/* Benches Tab */}
      {activeTab === 'benches' && (
        <>
          <TouchableOpacity 
            style={[localStyles.locationSelector, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
            onPress={() => setLocationModalVisible(true)}
          >
            <Ionicons name="location" size={18} color={colors.button.primary} />
            <Text style={[localStyles.locationText, { color: colors.text.primary }]} numberOfLines={1}>
              {selectedLocationName || 'my location'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.icon.secondary} />
          </TouchableOpacity>

          <View style={styles.searchSection}>
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClear={() => setSearchQuery('')}
              placeholder="search bench names..."
            />
          </View>

          {showFilters && (
            <SearchFilters
              viewType={viewType}
              ratingFilter={ratingFilter}
              distanceFilter={distanceFilter}
              sortBy={sortBy}
              onViewTypeChange={setViewType}
              onRatingFilterChange={setRatingFilter}
              onDistanceFilterChange={setDistanceFilter}
              onSortByChange={setSortBy}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          )}

          <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.icon.primary} />
              </View>
            ) : results.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={colors.icon.muted} />
                <Text style={styles.emptyStateTitle}>no benches found</Text>
                <Text style={styles.emptyStateText}>
                  {selectedLocationName ? `no benches in ${selectedLocationName}` : 'try adjusting your filters'}
                </Text>
              </View>
            ) : (
              <View style={styles.resultsList}>
                <Text style={styles.resultsCount}>
                  {results.length} {results.length === 1 ? 'bench' : 'benches'}
                  {selectedLocationName ? ` near ${selectedLocationName}` : ' nearby'}
                </Text>
                {results.map((bench) => (
                  <SearchResultCard
                    key={bench.id}
                    bench={bench}
                    onPress={() => navigation.navigate('BenchDetail', { benchId: bench.id })}
                  />
                ))}
              </View>
            )}
            <View style={{ height: 80 }} />
          </ScrollView>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          <View style={styles.searchSection}>
            <View style={[localStyles.userSearchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.icon.secondary} />
              <TextInput
                style={[localStyles.userSearchInput, { color: colors.text.primary }]}
                placeholder="search by username..."
                placeholderTextColor={colors.input.placeholder}
                value={userSearchQuery}
                onChangeText={setUserSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {userSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setUserSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.icon.secondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {userLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.icon.primary} />
            </View>
          ) : userSearchQuery.trim().length < 2 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.icon.muted} />
              <Text style={styles.emptyStateTitle}>find users</Text>
              <Text style={styles.emptyStateText}>search by username to find and follow other bench spotters</Text>
            </View>
          ) : userResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="person-outline" size={48} color={colors.icon.muted} />
              <Text style={styles.emptyStateTitle}>no users found</Text>
              <Text style={styles.emptyStateText}>try a different username</Text>
            </View>
          ) : (
            <FlatList
              data={userResults}
              keyExtractor={(item) => item.id}
              renderItem={renderUserItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 80 }}
            />
          )}
        </>
      )}

      {/* Location Modal */}
      <KeyboardAwareModal visible={locationModalVisible} onClose={() => setLocationModalVisible(false)}>
        <View style={[localStyles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[localStyles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={[localStyles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[localStyles.modalTitle, { color: colors.text.primary }]}>explore location</Text>
                  <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.icon.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={localStyles.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  <View style={[localStyles.searchRow, { borderBottomColor: colors.border }]}>
                    <Ionicons name="search" size={20} color={colors.icon.secondary} />
                    <TextInput
                      style={[localStyles.locationInput, { color: colors.text.primary }]}
                      placeholder="search city, country, or place..."
                      placeholderTextColor={colors.input.placeholder}
                      value={locationQuery}
                      onChangeText={setLocationQuery}
                      onSubmitEditing={searchLocation}
                      returnKeyType="search"
                      autoFocus
                    />
                    {locationQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setLocationQuery('')}>
                        <Ionicons name="close-circle" size={20} color={colors.icon.secondary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[localStyles.searchButton, { backgroundColor: colors.button.primary }]}
                    onPress={searchLocation}
                    disabled={searchingLocation || !locationQuery.trim()}
                  >
                    {searchingLocation ? (
                      <ActivityIndicator size="small" color={colors.button.primaryText} />
                    ) : (
                      <Text style={[localStyles.searchButtonText, { color: colors.button.primaryText }]}>search</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity style={[localStyles.myLocationButton, { borderColor: colors.border }]} onPress={resetToMyLocation}>
                    <Ionicons name="navigate" size={20} color={colors.button.primary} />
                    <Text style={[localStyles.myLocationText, { color: colors.text.primary }]}>use my current location</Text>
                  </TouchableOpacity>

                  {locationResults.map((loc, index) => (
                    <TouchableOpacity key={index} style={[localStyles.locationResultItem, { borderBottomColor: colors.border }]} onPress={() => selectLocation(loc)}>
                      <Ionicons name={loc.type === 'city' ? 'business' : 'location'} size={20} color={colors.icon.secondary} />
                      <Text style={[localStyles.locationResultText, { color: colors.text.primary }]} numberOfLines={2}>{loc.name}</Text>
                    </TouchableOpacity>
                  ))}

                  {locationResults.length === 0 && !searchingLocation && (
                    <View style={localStyles.suggestionsContainer}>
                      <Text style={[localStyles.suggestionsTitle, { color: colors.text.tertiary }]}>suggestions</Text>
                      {['New York, USA', 'London, UK', 'Tokyo, Japan', 'Paris, France', 'Sydney, Australia'].map((suggestion) => (
                        <TouchableOpacity
                          key={suggestion}
                          style={[localStyles.suggestionItem, { borderColor: colors.border }]}
                          onPress={() => { setLocationQuery(suggestion); setTimeout(() => searchLocation(), 100); }}
                        >
                          <Ionicons name="trending-up" size={16} color={colors.icon.secondary} />
                          <Text style={[localStyles.suggestionText, { color: colors.text.secondary }]}>{suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <View style={{ height: 40 }} />
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </KeyboardAwareModal>
    </View>
  );
}

const localStyles = {
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '500' },
  userSearchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 10 },
  userSearchInput: { flex: 1, fontSize: 15, fontWeight: '400' },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  userAvatarContainer: { marginRight: 12 },
  userAvatar: { width: 44, height: 44, borderRadius: 22 },
  userAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  userInfo: { flex: 1 },
  username: { fontSize: 15, fontWeight: '500' },
  fullName: { fontSize: 13, fontWeight: '300', marginTop: 2 },
  followButton: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  followButtonText: { fontSize: 13, fontWeight: '600' },
  youBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  youBadgeText: { fontSize: 12, fontWeight: '500' },
  locationSelector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 12, gap: 8, borderBottomWidth: 1 },
  locationText: { flex: 1, fontSize: 14, fontWeight: '400' },
  exploreButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  exploreButtonText: { fontSize: 14, fontWeight: '500' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', minHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '300', letterSpacing: 1 },
  modalBody: { padding: 24, flex: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottomWidth: 1 },
  locationInput: { flex: 1, fontSize: 16, fontWeight: '300', paddingVertical: 8 },
  searchButton: { marginTop: 16, paddingVertical: 12, borderRadius: 20, alignItems: 'center' },
  searchButtonText: { fontSize: 15, fontWeight: '500' },
  myLocationButton: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderRadius: 12 },
  myLocationText: { fontSize: 14, fontWeight: '400' },
  locationResultItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  locationResultText: { flex: 1, fontSize: 14, fontWeight: '300', lineHeight: 20 },
  suggestionsContainer: { marginTop: 24 },
  suggestionsTitle: { fontSize: 12, fontWeight: '400', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderRadius: 8, marginBottom: 8 },
  suggestionText: { fontSize: 14, fontWeight: '300' },
};