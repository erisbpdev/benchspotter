import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

// Import extracted components
import PhotoCarousel from '../components/PhotoCarousel';
import BenchInfo from '../components/BenchInfo';
import RatingDisplay from '../components/RatingDisplay';
import CommentSection from '../components/CommentSection';
import RatingModal from '../components/RatingModal';

export default function BenchDetailScreen({ route, navigation }) {
  const { benchId } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [bench, setBench] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [comments, setComments] = useState([]);
  const [creator, setCreator] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [tempViewRating, setTempViewRating] = useState(0);
  const [tempComfortRating, setTempComfortRating] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isFollowingCreator, setIsFollowingCreator] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Check if current user is the owner of this bench
  const isOwner = user && bench && user.id === bench.user_id;

  useEffect(() => {
    fetchBenchDetails();
    if (user) {
      checkIfFavorite();
    }
  }, [benchId, user]);

  // Refresh data when returning from edit screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (bench) {
        fetchBenchDetails();
      }
    });
    return unsubscribe;
  }, [navigation, bench]);

  const fetchBenchDetails = async () => {
    try {
      // Fetch all data including favorite count
      const [benchData, photosData, ratingsData, commentsData, favCount] = await Promise.all([
        api.benches.getById(benchId),
        api.photos.getByBenchId(benchId),
        api.ratings.getByBenchId(benchId),
        api.comments.getByBenchId(benchId),
        api.benches.getFavoriteCount(benchId),
      ]);

      setBench(benchData);
      setPhotos(photosData);
      setRatings(ratingsData);
      
      // Fetch like status for each comment if user is logged in
      if (user && commentsData.length > 0) {
        const commentsWithLikes = await Promise.all(
          commentsData.map(async (comment) => {
            try {
              const [isLiked, likeCount] = await Promise.all([
                api.commentLikes.isLiked(comment.id, user.id),
                api.commentLikes.getCount(comment.id)
              ]);
              return {
                ...comment,
                user_has_liked: isLiked,
                like_count: likeCount
              };
            } catch (error) {
              console.error('Error fetching comment like status:', error);
              return {
                ...comment,
                user_has_liked: false,
                like_count: 0
              };
            }
          })
        );
        setComments(commentsWithLikes);
      } else {
        // For non-logged in users, fetch counts only
        const commentsWithCounts = await Promise.all(
          commentsData.map(async (comment) => {
            try {
              const likeCount = await api.commentLikes.getCount(comment.id);
              return {
                ...comment,
                user_has_liked: false,
                like_count: likeCount
              };
            } catch (error) {
              return {
                ...comment,
                user_has_liked: false,
                like_count: 0
              };
            }
          })
        );
        setComments(commentsWithCounts);
      }
      
      setFavoriteCount(favCount);

      // Fetch creator profile
      if (benchData?.user_id) {
        const profileData = await api.profiles.getById(benchData.user_id);
        setCreator(profileData);

        // Check if following creator
        if (user && user.id !== benchData.user_id) {
          const following = await api.follows.isFollowing(user.id, benchData.user_id);
          setIsFollowingCreator(following);
        }
      }

      // Find user's rating if logged in
      if (user) {
        const userRatingData = ratingsData.find(r => r.user_id === user.id);
        setUserRating(userRatingData || null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching bench details:', error);
      Alert.alert('Error', 'Could not load bench details');
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    try {
      const isFav = await api.favorites.isFavorite(benchId, user.id);
      setIsFavorite(isFav);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to favorite benches');
      return;
    }

    try {
      const newStatus = await api.favorites.toggle(benchId, user.id);
      setIsFavorite(newStatus);
      setFavoriteCount(prev => newStatus ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Could not update favorite');
    }
  };

  const toggleFollowCreator = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to follow users');
      return;
    }

    if (!creator) return;

    setFollowLoading(true);
    try {
      const newStatus = await api.follows.toggle(user.id, creator.id);
      setIsFollowingCreator(newStatus);
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Could not update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleEditBench = () => {
    navigation.navigate('EditBench', { bench });
  };

  const handleDeleteBench = useCallback(async () => {
    if (!isOwner) return;

    // Cross-platform confirmation
    const confirmDelete = () => {
      return new Promise((resolve) => {
        if (typeof window !== 'undefined' && window.confirm) {
          resolve(window.confirm(`Delete "${bench.title}"? This action cannot be undone.`));
        } else {
          Alert.alert(
            'Delete Bench',
            `Delete "${bench.title}"? This action cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        }
      });
    };

    const shouldDelete = await confirmDelete();
    if (!shouldDelete) return;

    setDeleting(true);

    try {
      await api.benches.delete(benchId, user.id);

      Alert.alert('Deleted', 'Bench has been deleted', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error deleting bench:', error);
      Alert.alert('Error', 'Could not delete bench. Please try again.');
    } finally {
      setDeleting(false);
    }
  }, [isOwner, bench, benchId, user, navigation]);

  const openRatingModal = () => {
    setTempViewRating(userRating?.view_rating || 0);
    setTempComfortRating(userRating?.comfort_rating || 0);
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to rate benches');
      return;
    }

    try {
      await api.ratings.upsert({
        benchId,
        userId: user.id,
        viewRating: tempViewRating,
        comfortRating: tempComfortRating,
      });

      setShowRatingModal(false);
      fetchBenchDetails(); // Refresh to get updated ratings
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Could not submit rating');
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to comment');
      return;
    }

    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await api.comments.create({
        benchId,
        userId: user.id,
        text: commentText,
      });

      setCommentText('');
      Keyboard.dismiss();
      fetchBenchDetails(); // Refresh to get updated comments
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Could not add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to like comments');
      return;
    }

    try {
      const newStatus = await api.commentLikes.toggle(commentId, user.id);
      
      // Update local state
      setComments(prevComments => 
        prevComments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              user_has_liked: newStatus,
              like_count: newStatus ? (comment.like_count || 0) + 1 : Math.max(0, (comment.like_count || 0) - 1)
            };
          }
          // Also check replies
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => {
                if (reply.id === commentId) {
                  return {
                    ...reply,
                    user_has_liked: newStatus,
                    like_count: newStatus ? (reply.like_count || 0) + 1 : Math.max(0, (reply.like_count || 0) - 1)
                  };
                }
                return reply;
              })
            };
          }
          return comment;
        })
      );
    } catch (error) {
      console.error('Error liking comment:', error);
      Alert.alert('Error', 'Could not like comment');
    }
  };

  const handleReplyToComment = async (parentId, text) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to reply');
      return;
    }

    if (!text.trim()) return;

    setSubmittingComment(true);
    try {
      await api.comments.create({
        benchId,
        userId: user.id,
        text: text.trim(),
        parentId,
      });

      setCommentText('');
      Keyboard.dismiss();
      fetchBenchDetails(); // Refresh to get updated comments
    } catch (error) {
      console.error('Error adding reply:', error);
      Alert.alert('Error', 'Could not add reply');
    } finally {
      setSubmittingComment(false);
    }
  };

  const openDirections = () => {
    const url = Platform.select({
      ios: `maps:?daddr=${bench.latitude},${bench.longitude}`,
      android: `geo:${bench.latitude},${bench.longitude}?q=${bench.latitude},${bench.longitude}`,
    });

    Linking.openURL(url).catch(() => {
      // Fallback to Google Maps
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${bench.latitude},${bench.longitude}`);
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.icon.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.icon.primary} />
        </View>
      </View>
    );
  }

  if (!bench) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.icon.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>bench not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.icon.primary} />
        </TouchableOpacity>

        <View style={localStyles.headerRight}>
          {/* Edit button - only visible to owner */}
          {isOwner && (
            <TouchableOpacity
              onPress={handleEditBench}
              style={localStyles.headerButton}
            >
              <Ionicons name="create-outline" size={22} color={colors.button.primary} />
            </TouchableOpacity>
          )}

          {/* Delete button - only visible to owner */}
          {isOwner && (
            <TouchableOpacity
              onPress={handleDeleteBench}
              disabled={deleting}
              style={localStyles.headerButton}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={colors.destructive} />
              ) : (
                <Ionicons name="trash-outline" size={22} color={colors.destructive} />
              )}
            </TouchableOpacity>
          )}

          {/* Favorite button with count */}
          <View style={localStyles.favoriteContainer}>
            <TouchableOpacity onPress={toggleFavorite} style={localStyles.headerButton}>
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? colors.destructive : colors.icon.primary}
              />
            </TouchableOpacity>
            {favoriteCount > 0 && (
              <Text style={[localStyles.favoriteCount, { color: colors.text.secondary }]}>
                {favoriteCount}
              </Text>
            )}
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photos */}
          <PhotoCarousel photos={photos} />

          {/* Main Info with integrated follow button */}
          <BenchInfo 
            bench={bench} 
            creator={creator}
            isOwner={isOwner}
            user={user}
            isFollowingCreator={isFollowingCreator}
            onFollowToggle={toggleFollowCreator}
            followLoading={followLoading}
          />

          {/* Owner badge - tappable to edit */}
          {isOwner && (
            <TouchableOpacity 
              style={[localStyles.ownerBadge, { backgroundColor: colors.card.background, borderColor: colors.border }]}
              onPress={handleEditBench}
            >
              <Ionicons name="person-outline" size={14} color={colors.text.secondary} />
              <Text style={[localStyles.ownerBadgeText, { color: colors.text.secondary }]}>
                you added this bench
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}

          {/* Ratings */}
          <RatingDisplay
            ratings={ratings}
            user={user}
            userRating={userRating}
            onRatePress={openRatingModal}
          />

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>location</Text>

            <Text style={styles.coordinates}>
              {bench.latitude.toFixed(4)}, {bench.longitude.toFixed(4)}
            </Text>

            <View style={localStyles.locationButtons}>
              <TouchableOpacity
                style={[styles.actionButton, localStyles.locationButton]}
                onPress={() => navigation.navigate('MainTabs', {
                  screen: 'Explore',
                  params: {
                    focusBench: {
                      id: bench.id,
                      latitude: bench.latitude,
                      longitude: bench.longitude,
                      title: bench.title,
                    }
                  }
                })}
              >
                <Ionicons name="map-outline" size={16} color={colors.button.primaryText} />
                <Text style={styles.actionButtonText}>show in map</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, localStyles.locationButton, {
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: colors.border,
                }]}
                onPress={openDirections}
              >
                <Ionicons name="navigate-outline" size={16} color={colors.text.primary} />
                <Text style={[styles.actionButtonText, { color: colors.text.primary }]}>
                  directions
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments */}
          <CommentSection
            comments={comments}
            user={user}
            commentText={commentText}
            onCommentTextChange={setCommentText}
            onAddComment={handleAddComment}
            submittingComment={submittingComment}
            onLikeComment={handleLikeComment}
            onReplyToComment={handleReplyToComment}
          />

          {/* Delete section for owner - secondary option at bottom */}
          {isOwner && (
            <View style={[localStyles.dangerZone, { borderColor: colors.destructive }]}>
              <Text style={[localStyles.dangerZoneTitle, { color: colors.destructive }]}>
                danger zone
              </Text>
              <Text style={[localStyles.dangerZoneText, { color: colors.text.secondary }]}>
                Deleting this bench will remove all photos, ratings, and comments permanently.
              </Text>
              <TouchableOpacity
                style={[localStyles.deleteButton, { borderColor: colors.destructive }]}
                onPress={handleDeleteBench}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={colors.destructive} />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                    <Text style={[localStyles.deleteButtonText, { color: colors.destructive }]}>
                      delete bench
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Extra padding for keyboard */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Rating Modal */}
      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        viewRating={tempViewRating}
        comfortRating={tempComfortRating}
        onViewRatingChange={setTempViewRating}
        onComfortRatingChange={setTempComfortRating}
        onSubmit={submitRating}
      />
    </View>
  );
}

const localStyles = {
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 8,
  },
  ownerBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dangerZone: {
    marginTop: 32,
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  dangerZoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  dangerZoneText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  favoriteContainer: {
    alignItems: 'center',
    gap: 2,
  },
  favoriteCount: {
    fontSize: 11,
    fontWeight: '500',
  },
};