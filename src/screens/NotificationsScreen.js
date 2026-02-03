import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.notifications.getByUserId(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark all as read when leaving screen
  useEffect(() => {
    return () => {
      if (user && notifications.some(n => !n.is_read)) {
        api.notifications.markAllAsRead(user.id).catch(console.error);
      }
    };
  }, [user, notifications]);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getNotificationContent = (notification) => {
    const actor = notification.actor?.username || 'Someone';
    const benchTitle = notification.bench?.title;

    switch (notification.type) {
      case 'follow':
        return {
          icon: 'person-add',
          iconColor: colors.button.primary,
          text: <Text><Text style={localStyles.bold}>@{actor}</Text> started following you</Text>,
        };
      case 'favorite':
        return {
          icon: 'heart',
          iconColor: colors.destructive,
          text: <Text><Text style={localStyles.bold}>@{actor}</Text> favorited your bench <Text style={localStyles.bold}>{benchTitle}</Text></Text>,
        };
      case 'comment':
        return {
          icon: 'chatbubble',
          iconColor: colors.button.primary,
          text: <Text><Text style={localStyles.bold}>@{actor}</Text> commented on <Text style={localStyles.bold}>{benchTitle}</Text></Text>,
        };
      case 'reply':
        return {
          icon: 'arrow-undo',
          iconColor: '#9333EA', // Purple
          text: <Text><Text style={localStyles.bold}>@{actor}</Text> replied to your comment on <Text style={localStyles.bold}>{benchTitle}</Text></Text>,
        };
      case 'mention':
        return {
          icon: 'at',
          iconColor: '#F59E0B', // Amber
          text: <Text><Text style={localStyles.bold}>@{actor}</Text> mentioned you in <Text style={localStyles.bold}>{benchTitle}</Text></Text>,
        };
      case 'comment_like':
        return {
          icon: 'heart',
          iconColor: '#EC4899', // Pink
          text: <Text><Text style={localStyles.bold}>@{actor}</Text> liked your comment on <Text style={localStyles.bold}>{benchTitle}</Text></Text>,
        };
      case 'rating':
        return {
          icon: 'star',
          iconColor: '#FFB800',
          text: <Text><Text style={localStyles.bold}>@{actor}</Text> rated your bench <Text style={localStyles.bold}>{benchTitle}</Text></Text>,
        };
      default:
        return {
          icon: 'notifications',
          iconColor: colors.icon.secondary,
          text: <Text>New notification</Text>,
        };
    }
  };

  const handleNotificationPress = (notification) => {
    // Mark as read
    if (!notification.is_read) {
      api.notifications.markAsRead(notification.id).catch(console.error);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    }

    // Navigate based on type
    switch (notification.type) {
      case 'follow':
        if (notification.actor?.id) {
          navigation.navigate('UserProfile', { userId: notification.actor.id });
        }
        break;
      case 'favorite':
      case 'comment':
      case 'reply':
      case 'mention':
      case 'comment_like':
      case 'rating':
        if (notification.bench?.id) {
          navigation.navigate('BenchDetail', { benchId: notification.bench.id });
        }
        break;
    }
  };

  const renderNotificationItem = ({ item }) => {
    const content = getNotificationContent(item);

    return (
      <TouchableOpacity
        style={[
          localStyles.notificationItem,
          { 
            backgroundColor: item.is_read ? colors.background : colors.card.background,
            borderBottomColor: colors.border,
          }
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        {/* Actor Avatar */}
        <View style={localStyles.avatarContainer}>
          {item.actor?.avatar_url ? (
            <Image source={{ uri: item.actor.avatar_url }} style={localStyles.avatar} />
          ) : (
            <View style={[localStyles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
              <Ionicons name="person" size={18} color={colors.icon.secondary} />
            </View>
          )}
          <View style={[localStyles.iconBadge, { backgroundColor: content.iconColor }]}>
            <Ionicons name={content.icon} size={10} color="#fff" />
          </View>
        </View>

        {/* Content */}
        <View style={localStyles.contentContainer}>
          <Text style={[localStyles.notificationText, { color: colors.text.primary }]}>
            {content.text}
          </Text>
          <Text style={[localStyles.timeText, { color: colors.text.tertiary }]}>
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>

        {/* Unread indicator */}
        {!item.is_read && (
          <View style={[localStyles.unreadDot, { backgroundColor: colors.button.primary }]} />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={localStyles.emptyState}>
      <Ionicons name="notifications-outline" size={64} color={colors.icon.muted} />
      <Text style={[localStyles.emptyTitle, { color: colors.text.primary }]}>
        no notifications yet
      </Text>
      <Text style={[localStyles.emptySubtitle, { color: colors.text.secondary }]}>
        when someone follows you or interacts with your benches, you'll see it here
      </Text>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>notifications</Text>
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={20} color={colors.icon.primary} />
          </TouchableOpacity>
        </View>
        <View style={localStyles.emptyState}>
          <Ionicons name="log-in-outline" size={64} color={colors.icon.muted} />
          <Text style={[localStyles.emptyTitle, { color: colors.text.primary }]}>
            sign in to see notifications
          </Text>
          <TouchableOpacity
            style={[localStyles.signInButton, { backgroundColor: colors.button.primary }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[localStyles.signInButtonText, { color: colors.button.primaryText }]}>
              sign in
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>notifications</Text>
        <TouchableOpacity onPress={toggleTheme}>
          <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={20} color={colors.icon.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.icon.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={notifications.length === 0 ? { flex: 1 } : null}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
              tintColor={colors.icon.primary}
            />
          }
        />
      )}
    </View>
  );
}

const localStyles = {
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contentContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '300',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  signInButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  signInButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
};