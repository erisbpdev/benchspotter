import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

export default function FeedScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState({}); // { benchId: true/false }
  const [favoriteCounts, setFavoriteCounts] = useState({}); // { benchId: count }

  const fetchFeed = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const followingData = await api.follows.getFollowing(user.id);
      const followingIds = followingData.map(f => f.following_id);

      if (followingIds.length === 0) {
        setFeedItems([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch benches from all followed users
      const benchPromises = followingIds.map(id => api.benches.getByUserId(id));
      const benchResults = await Promise.all(benchPromises);

      // Combine and add creator info
      const allBenches = [];
      for (let i = 0; i < benchResults.length; i++) {
        const benches = benchResults[i];
        const creatorProfile = followingData[i].profiles;
        
        for (const bench of benches) {
          allBenches.push({ ...bench, creator: creatorProfile });
        }
      }

      // Sort by newest first
      allBenches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setFeedItems(allBenches);

      // Fetch favorite status and counts for all benches in a single batch query
      const benchIds = allBenches.map(bench => bench.id);
      try {
        const { statuses, counts } = await api.favorites.getBatchData(benchIds, user.id);
        setFavorites(statuses);
        setFavoriteCounts(counts);
      } catch (error) {
        console.error('Error fetching favorite data:', error);
        // Initialize with empty values on error
        const emptyStatuses = {};
        const emptyCounts = {};
        benchIds.forEach(id => {
          emptyStatuses[id] = false;
          emptyCounts[id] = 0;
        });
        setFavorites(emptyStatuses);
        setFavoriteCounts(emptyCounts);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
      Alert.alert('Error', 'Could not load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user && feedItems.length > 0) {
        // Silently refresh favorite statuses
        refreshFavoriteStatuses();
      }
    });
    return unsubscribe;
  }, [navigation, user, feedItems]);

  const refreshFavoriteStatuses = async () => {
    if (!user || feedItems.length === 0) return;

    const benchIds = feedItems.map(bench => bench.id);
    try {
      const { statuses, counts } = await api.favorites.getBatchData(benchIds, user.id);
      setFavorites(statuses);
      setFavoriteCounts(counts);
    } catch (error) {
      // Keep existing values on error (silent refresh)
      console.error('Error refreshing favorite statuses:', error);
    }
  };

  const toggleFavorite = async (benchId) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to favorite benches');
      return;
    }

    // Optimistic update
    const wasFavorite = favorites[benchId];
    setFavorites(prev => ({ ...prev, [benchId]: !wasFavorite }));
    setFavoriteCounts(prev => ({ 
      ...prev, 
      [benchId]: wasFavorite ? Math.max(0, (prev[benchId] || 0) - 1) : (prev[benchId] || 0) + 1 
    }));

    try {
      const newStatus = await api.favorites.toggle(benchId, user.id);
      // Update with actual status from server
      setFavorites(prev => ({ ...prev, [benchId]: newStatus }));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert on error
      setFavorites(prev => ({ ...prev, [benchId]: wasFavorite }));
      setFavoriteCounts(prev => ({ 
        ...prev, 
        [benchId]: wasFavorite ? (prev[benchId] || 0) + 1 : Math.max(0, (prev[benchId] || 0) - 1)
      }));
      Alert.alert('Error', 'Could not update favorite');
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderFeedItem = ({ item }) => {
    const primaryPhoto = item.bench_photos?.find(p => p.is_primary);
    const isFavorite = favorites[item.id] || false;
    const favoriteCount = favoriteCounts[item.id] || 0;

    return (
      <View style={[localStyles.feedItem, { backgroundColor: colors.card.background }]}>
        {/* Creator Header */}
        <TouchableOpacity
          style={localStyles.creatorHeader}
          onPress={() => navigation.navigate('UserProfile', { userId: item.creator.id })}
        >
          {item.creator.avatar_url ? (
            <Image source={{ uri: item.creator.avatar_url }} style={localStyles.creatorAvatar} />
          ) : (
            <View style={[localStyles.creatorAvatarPlaceholder, { backgroundColor: colors.surface }]}>
              <Ionicons name="person" size={16} color={colors.icon.secondary} />
            </View>
          )}
          <View style={localStyles.creatorInfo}>
            <Text style={[localStyles.creatorUsername, { color: colors.text.primary }]}>
              @{item.creator.username}
            </Text>
            <Text style={[localStyles.timeAgo, { color: colors.text.tertiary }]}>
              {formatTimeAgo(item.created_at)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Bench Content */}
        <TouchableOpacity
          style={localStyles.benchContent}
          onPress={() => navigation.navigate('BenchDetail', { benchId: item.id })}
        >
          {primaryPhoto ? (
            <Image source={{ uri: primaryPhoto.photo_url }} style={localStyles.benchPhoto} />
          ) : (
            <View style={[localStyles.benchPhotoPlaceholder, { backgroundColor: colors.surface }]}>
              <Ionicons name="image-outline" size={40} color={colors.icon.muted} />
            </View>
          )}

          <View style={localStyles.benchInfo}>
            <View style={[localStyles.viewTypeBadge, { backgroundColor: colors.surface }]}>
              <Text style={[localStyles.viewTypeText, { color: colors.text.secondary }]}>
                {item.view_type}
              </Text>
            </View>
            <Text style={[localStyles.benchTitle, { color: colors.text.primary }]}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={[localStyles.benchDescription, { color: colors.text.secondary }]} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Actions */}
        <View style={[localStyles.actions, { borderTopColor: colors.border }]}>
          {/* Favorite Button */}
          <TouchableOpacity
            style={localStyles.actionButton}
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={18} 
              color={isFavorite ? colors.destructive : colors.icon.secondary} 
            />
            <Text style={[
              localStyles.actionText, 
              { color: isFavorite ? colors.destructive : colors.text.secondary }
            ]}>
              {favoriteCount > 0 ? favoriteCount : 'favorite'}
            </Text>
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity
            style={localStyles.actionButton}
            onPress={() => navigation.navigate('BenchDetail', { benchId: item.id })}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.icon.secondary} />
            <Text style={[localStyles.actionText, { color: colors.text.secondary }]}>comment</Text>
          </TouchableOpacity>

          {/* Map Button */}
          <TouchableOpacity
            style={localStyles.actionButton}
            onPress={() => navigation.navigate('MainTabs', {
              screen: 'Explore',
              params: { focusBench: { id: item.id, latitude: item.latitude, longitude: item.longitude, title: item.title } }
            })}
          >
            <Ionicons name="map-outline" size={18} color={colors.icon.secondary} />
            <Text style={[localStyles.actionText, { color: colors.text.secondary }]}>map</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={localStyles.emptyState}>
      <Ionicons name="people-outline" size={64} color={colors.icon.muted} />
      <Text style={[localStyles.emptyTitle, { color: colors.text.primary }]}>
        your feed is empty
      </Text>
      <Text style={[localStyles.emptySubtitle, { color: colors.text.secondary }]}>
        follow other bench spotters to see their discoveries here
      </Text>
      <TouchableOpacity
        style={[localStyles.exploreButton, { backgroundColor: colors.button.primary }]}
        onPress={() => navigation.navigate('Search')}
      >
        <Text style={[localStyles.exploreButtonText, { color: colors.button.primaryText }]}>
          find users to follow
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>feed</Text>
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={20} color={colors.icon.primary} />
          </TouchableOpacity>
        </View>
        <View style={localStyles.emptyState}>
          <Ionicons name="log-in-outline" size={64} color={colors.icon.muted} />
          <Text style={[localStyles.emptyTitle, { color: colors.text.primary }]}>sign in to see your feed</Text>
          <TouchableOpacity
            style={[localStyles.exploreButton, { backgroundColor: colors.button.primary }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[localStyles.exploreButtonText, { color: colors.button.primaryText }]}>sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>feed</Text>
        <TouchableOpacity onPress={toggleTheme}>
          <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={20} color={colors.icon.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.icon.primary} />
          <Text style={styles.loadingText}>loading feed...</Text>
        </View>
      ) : (
        <FlatList
          data={feedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderFeedItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={feedItems.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFeed(); }} tintColor={colors.icon.primary} />
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const localStyles = {
  feedItem: { marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  creatorHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  creatorAvatar: { width: 36, height: 36, borderRadius: 18 },
  creatorAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  creatorInfo: { marginLeft: 10, flex: 1 },
  creatorUsername: { fontSize: 14, fontWeight: '600' },
  timeAgo: { fontSize: 12, fontWeight: '300', marginTop: 1 },
  benchContent: { paddingHorizontal: 12 },
  benchPhoto: { width: '100%', height: 200, borderRadius: 8 },
  benchPhotoPlaceholder: { width: '100%', height: 160, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  benchInfo: { paddingVertical: 12 },
  viewTypeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  viewTypeText: { fontSize: 11, fontWeight: '500' },
  benchTitle: { fontSize: 17, fontWeight: '500', marginBottom: 4 },
  benchDescription: { fontSize: 14, fontWeight: '300', lineHeight: 20 },
  actions: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 10, paddingHorizontal: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 16 },
  actionText: { fontSize: 13, fontWeight: '400' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '500', marginTop: 16, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, fontWeight: '300', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  exploreButton: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  exploreButtonText: { fontSize: 15, fontWeight: '600' },
};