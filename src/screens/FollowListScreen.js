import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

export default function FollowListScreen({ route, navigation }) {
  const { userId, username, type } = route.params; // type: 'followers' or 'following'
  const { user: currentUser } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState({});

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      let data;
      if (type === 'followers') {
        data = await api.follows.getFollowers(userId);
      } else {
        data = await api.follows.getFollowing(userId);
      }

      const profiles = data.map(item => ({
        ...item.profiles,
        followedAt: item.created_at,
      }));

      setUsers(profiles);

      // Check follow status for each user
      if (currentUser) {
        const statusMap = {};
        for (const profile of profiles) {
          if (profile.id !== currentUser.id) {
            const isFollowing = await api.follows.isFollowing(currentUser.id, profile.id);
            statusMap[profile.id] = isFollowing;
          }
        }
        setFollowingStatus(statusMap);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Could not load users');
    } finally {
      setLoading(false);
    }
  }, [userId, type, currentUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const renderUserItem = ({ item }) => {
    const isCurrentUser = currentUser && item.id === currentUser.id;
    const isFollowing = followingStatus[item.id];

    return (
      <TouchableOpacity
        style={[localStyles.userItem, { borderBottomColor: colors.border }]}
        onPress={() => navigation.push('UserProfile', { userId: item.id })}
      >
        <View style={localStyles.avatarContainer}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={localStyles.avatar} />
          ) : (
            <View style={[localStyles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
              <Ionicons name="person" size={20} color={colors.icon.secondary} />
            </View>
          )}
        </View>

        <View style={localStyles.userInfo}>
          <Text style={[localStyles.usernameText, { color: colors.text.primary }]}>
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

  const renderEmptyState = () => (
    <View style={localStyles.emptyState}>
      <Ionicons 
        name={type === 'followers' ? 'people-outline' : 'person-add-outline'} 
        size={48} 
        color={colors.icon.muted} 
      />
      <Text style={[localStyles.emptyText, { color: colors.text.secondary }]}>
        {type === 'followers' ? 'no followers yet' : 'not following anyone yet'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.icon.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{type}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[localStyles.subtitle, { borderBottomColor: colors.border }]}>
        <Text style={[localStyles.subtitleText, { color: colors.text.secondary }]}>
          @{username}'s {type}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.icon.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={users.length === 0 ? { flex: 1 } : null}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const localStyles = {
  subtitle: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  subtitleText: { fontSize: 13, fontWeight: '400' },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  userInfo: { flex: 1 },
  usernameText: { fontSize: 15, fontWeight: '500' },
  fullName: { fontSize: 13, fontWeight: '300', marginTop: 2 },
  followButton: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  followButtonText: { fontSize: 13, fontWeight: '600' },
  youBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  youBadgeText: { fontSize: 12, fontWeight: '500' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '300' },
};