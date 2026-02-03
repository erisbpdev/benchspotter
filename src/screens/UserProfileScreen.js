import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
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

export default function UserProfileScreen({ route, navigation }) {
    const { userId, username } = route.params;
    const { user: currentUser } = useAuth();
    const { colors } = useTheme();
    const styles = useMemo(() => getStyles(colors), [colors]);

    const [profile, setProfile] = useState(null);
    const [userBenches, setUserBenches] = useState([]);
    const [stats, setStats] = useState({ benchesAdded: 0, followers: 0, following: 0 });
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);

    const isOwnProfile = currentUser && profile && currentUser.id === profile.id;

    const fetchUserData = useCallback(async () => {
        try {
            setLoading(true);

            let profileData;
            if (userId) {
                profileData = await api.profiles.getById(userId);
            } else if (username) {
                profileData = await api.profiles.getByUsername(username);
            }

            if (!profileData) {
                Alert.alert('Error', 'User not found');
                navigation.goBack();
                return;
            }

            setProfile(profileData);

            const [benchesData, followCounts] = await Promise.all([
                api.benches.getByUserId(profileData.id),
                api.follows.getCounts(profileData.id),
            ]);

            setUserBenches(benchesData);
            setStats({
                benchesAdded: benchesData.length,
                followers: followCounts.followers,
                following: followCounts.following,
            });

            if (currentUser && currentUser.id !== profileData.id) {
                const following = await api.follows.isFollowing(currentUser.id, profileData.id);
                setIsFollowing(following);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            Alert.alert('Error', 'Could not load user profile');
        } finally {
            setLoading(false);
        }
    }, [userId, username, currentUser, navigation]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const handleFollowToggle = async () => {
        if (!currentUser) {
            Alert.alert('Login Required', 'Please login to follow users');
            return;
        }
        if (isOwnProfile) return;

        setFollowLoading(true);
        try {
            const newStatus = await api.follows.toggle(currentUser.id, profile.id);
            setIsFollowing(newStatus);
            setStats(prev => ({
                ...prev,
                followers: newStatus ? prev.followers + 1 : prev.followers - 1,
            }));
        } catch (error) {
            console.error('Error toggling follow:', error);
            Alert.alert('Error', 'Could not update follow status');
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.icon.primary} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.loadingContainer}>
                <Ionicons name="person-outline" size={48} color={colors.icon.secondary} />
                <Text style={styles.errorText}>user not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.icon.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>@{profile.username}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={localStyles.profileHeader}>
                    <View style={localStyles.avatarContainer}>
                        {profile.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={localStyles.avatarImage} />
                        ) : (
                            <View style={[localStyles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                                <Ionicons name="person" size={40} color={colors.icon.secondary} />
                            </View>
                        )}
                    </View>

                    {profile.full_name && (
                        <Text style={[localStyles.fullName, { color: colors.text.primary }]}>
                            {profile.full_name}
                        </Text>
                    )}
                    <Text style={[localStyles.username, { color: colors.text.secondary }]}>
                        @{profile.username}
                    </Text>
                    {profile.bio && (
                        <Text style={[localStyles.bio, { color: colors.text.secondary }]}>
                            {profile.bio}
                        </Text>
                    )}

                    {currentUser && !isOwnProfile && (
                        <TouchableOpacity
                            style={[localStyles.followButton, {
                                backgroundColor: isFollowing ? colors.background : colors.button.primary,
                                borderColor: colors.button.primary,
                                borderWidth: isFollowing ? 1 : 0,
                            }]}
                            onPress={handleFollowToggle}
                            disabled={followLoading}
                        >
                            {followLoading ? (
                                <ActivityIndicator size="small" color={isFollowing ? colors.text.primary : colors.button.primaryText} />
                            ) : (
                                <>
                                    <Ionicons
                                        name={isFollowing ? "checkmark" : "person-add"}
                                        size={16}
                                        color={isFollowing ? colors.text.primary : colors.button.primaryText}
                                    />
                                    <Text style={[localStyles.followButtonText, {
                                        color: isFollowing ? colors.text.primary : colors.button.primaryText,
                                    }]}>
                                        {isFollowing ? 'following' : 'follow'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {isOwnProfile && (
                        <TouchableOpacity
                            style={[localStyles.editButton, { borderColor: colors.border }]}
                            onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
                        >
                            <Text style={[localStyles.editButtonText, { color: colors.text.primary }]}>
                                edit profile
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={[localStyles.statsContainer, { borderColor: colors.border }]}>
                    <View style={localStyles.statItem}>
                        <Text style={[localStyles.statNumber, { color: colors.text.primary }]}>
                            {stats.benchesAdded}
                        </Text>
                        <Text style={[localStyles.statLabel, { color: colors.text.tertiary }]}>benches</Text>
                    </View>

                    <TouchableOpacity
                        style={localStyles.statItem}
                        onPress={() => navigation.navigate('FollowList', { userId: profile.id, username: profile.username, type: 'followers' })}
                    >
                        <Text style={[localStyles.statNumber, { color: colors.text.primary }]}>
                            {stats.followers}
                        </Text>
                        <Text style={[localStyles.statLabel, { color: colors.text.tertiary }]}>followers</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={localStyles.statItem}
                        onPress={() => navigation.navigate('FollowList', { userId: profile.id, username: profile.username, type: 'following' })}
                    >
                        <Text style={[localStyles.statNumber, { color: colors.text.primary }]}>
                            {stats.following}
                        </Text>
                        <Text style={[localStyles.statLabel, { color: colors.text.tertiary }]}>following</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>
                        {isOwnProfile ? 'your benches' : `benches`}
                    </Text>

                    {userBenches.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="cafe-outline" size={32} color={colors.icon.muted} />
                            <Text style={styles.emptyText}>no benches yet</Text>
                        </View>
                    ) : (
                        <View style={styles.benchesList}>
                            {userBenches.map((bench) => {
                                const primaryPhoto = bench.bench_photos?.find(p => p.is_primary);
                                return (
                                    <TouchableOpacity
                                        key={bench.id}
                                        style={styles.benchCard}
                                        onPress={() => navigation.navigate('BenchDetail', { benchId: bench.id })}
                                    >
                                        {primaryPhoto ? (
                                            <Image source={{ uri: primaryPhoto.photo_url }} style={styles.benchImage} />
                                        ) : (
                                            <View style={styles.benchImagePlaceholder}>
                                                <Ionicons name="image-outline" size={24} color={colors.icon.muted} />
                                            </View>
                                        )}
                                        <View style={styles.benchInfo}>
                                            <Text style={styles.benchViewType}>{bench.view_type}</Text>
                                            <Text style={styles.benchTitle}>{bench.title}</Text>
                                            {bench.description && (
                                                <Text style={styles.benchDescription} numberOfLines={2}>{bench.description}</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>
        </View>
    );
}

const localStyles = {
    profileHeader: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
    avatarContainer: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
    avatarImage: { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    fullName: { fontSize: 22, fontWeight: '600', marginBottom: 4 },
    username: { fontSize: 15, fontWeight: '400', marginBottom: 8 },
    bio: { fontSize: 14, fontWeight: '300', textAlign: 'center', lineHeight: 20, marginTop: 8, paddingHorizontal: 20 },
    followButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, marginTop: 16 },
    followButtonText: { fontSize: 14, fontWeight: '600' },
    editButton: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginTop: 16 },
    editButtonText: { fontSize: 14, fontWeight: '500' },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, marginHorizontal: 20, borderTopWidth: 1, borderBottomWidth: 1 },
    statItem: { alignItems: 'center', paddingHorizontal: 16 },
    statNumber: { fontSize: 20, fontWeight: '600' },
    statLabel: { fontSize: 12, fontWeight: '400', marginTop: 2 },
};