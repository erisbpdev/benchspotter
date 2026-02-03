/**
 * BenchSpotter API Service Layer
 * 
 * Centralizes all Supabase database operations for easier maintenance,
 * testing, and potential backend swapping in the future.
 * 
 * Database Schema Reference:
 * - profiles: id (uuid, FK to auth.users), username (unique), full_name, avatar_url, bio
 * - benches: id, user_id (FK), title, description, latitude, longitude, location (PostGIS), view_type, accessibility_notes
 * - bench_photos: id, bench_id (FK), photo_url, is_primary, uploaded_at
 * - bench_ratings: id, bench_id (FK), user_id (FK), view_rating (1-5), comfort_rating (1-5)
 * - comments: id, bench_id (FK), user_id (FK), text, parent_id (FK to comments)
 * - comment_likes: id, comment_id (FK), user_id (FK), created_at
 * - favorites: user_id + bench_id (composite PK, no id column)
 * - follows: follower_id + following_id (composite PK, no id column)
 * - notifications: id, user_id (FK), actor_id (FK), type, bench_id (FK), comment_id (FK), is_read, created_at
 * 
 * Note: No cascade deletes - must manually delete related records before parent
 */

import { supabase } from './supabase';
import {
  benchCreateSchema,
  benchUpdateSchema,
  ratingSchema,
  commentCreateSchema,
  coordinatesSchema,
} from '../validation/schemas';
import { validateOrThrow } from '../validation/validate';

// ============================================================================
// BENCH OPERATIONS
// ============================================================================

export const benchService = {
  /**
   * Get a single bench by ID with all related data
   */
  async getById(benchId) {
    const { data, error } = await supabase
      .from('benches')
      .select('*')
      .eq('id', benchId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get ALL benches globally (no distance limit)
   */
  async getAll() {
    const { data, error } = await supabase
      .from('benches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get nearby benches using PostGIS function
   */
  async getNearby(latitude, longitude, radiusMeters = 5000) {
    // Validate coordinates
    const validatedCoords = validateOrThrow(coordinatesSchema, {
      latitude,
      longitude,
    });

    const { data, error } = await supabase.rpc('get_nearby_benches', {
      user_lat: validatedCoords.latitude,
      user_lng: validatedCoords.longitude,
      radius_meters: radiusMeters,
    });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get favorite count for a bench
   */
  async getFavoriteCount(benchId) {
    const { count, error } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('bench_id', benchId);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Search benches with optional filters
   */
  async search({ query, viewType, ratingFilter, sortBy, userLocation, maxDistance = 10 } = {}) {
    let supabaseQuery = supabase
      .from('benches')
      .select(`
        *,
        bench_photos (
          photo_url,
          is_primary
        ),
        bench_ratings (
          view_rating,
          comfort_rating
        )
      `);

    // Apply text search filter
    if (query?.trim()) {
      supabaseQuery = supabaseQuery.ilike('title', `%${query.trim()}%`);
    }

    // Apply view type filter
    if (viewType) {
      supabaseQuery = supabaseQuery.eq('view_type', viewType);
    }

    const { data: benches, error } = await supabaseQuery;

    if (error) throw error;

    // Process benches with ratings and distance
    let processedBenches = (benches || []).map(bench => {
      const ratings = bench.bench_ratings || [];
      let avgRating = 0;

      if (ratings.length > 0) {
        const totalView = ratings.reduce((sum, r) => sum + r.view_rating, 0);
        const totalComfort = ratings.reduce((sum, r) => sum + r.comfort_rating, 0);
        avgRating = (totalView + totalComfort) / (ratings.length * 2);
      }

      let distance = null;
      if (userLocation) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          bench.latitude,
          bench.longitude
        );
      }

      return {
        ...bench,
        avgRating,
        distance,
        ratingsCount: ratings.length,
      };
    });

    // Apply distance filter if user location is provided and maxDistance is set
    if (userLocation && maxDistance !== null) {
      processedBenches = processedBenches.filter(b => b.distance !== null && b.distance <= maxDistance);
    }

    // Apply rating filter (post-query since it's calculated)
    if (ratingFilter) {
      processedBenches = processedBenches.filter(b => b.avgRating >= ratingFilter);
    }

    // Apply sorting
    if (sortBy === 'distance' && userLocation) {
      processedBenches.sort((a, b) => a.distance - b.distance);
    } else if (sortBy === 'rating') {
      processedBenches.sort((a, b) => b.avgRating - a.avgRating);
    } else if (sortBy === 'recent') {
      processedBenches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return processedBenches;
  },

  /**
   * Get benches created by a specific user
   */
  async getByUserId(userId) {
    const { data, error } = await supabase
      .from('benches')
      .select('*, bench_photos(photo_url, is_primary)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new bench
   */
  async create({ userId, title, description, latitude, longitude, viewType, accessibilityNotes }) {
    // Validate input data
    const validatedData = validateOrThrow(benchCreateSchema, {
      title,
      description,
      latitude,
      longitude,
      viewType,
      accessibilityNotes,
    });

    const { data, error } = await supabase
      .from('benches')
      .insert({
        user_id: userId,
        title: validatedData.title,
        description: validatedData.description,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        view_type: validatedData.viewType,
        accessibility_notes: validatedData.accessibilityNotes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing bench
   */
  async update(benchId, userId, updates) {
    const { data, error } = await supabase
      .from('benches')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', benchId)
      .eq('user_id', userId) // Ensure user owns the bench
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a bench and all related data
   */
  async delete(benchId, userId) {
    // Get photos first for storage cleanup
    const photos = await photoService.getByBenchId(benchId);

    // Delete photos from storage
    if (photos.length > 0) {
      await photoService.deleteFromStorage(photos);
    }

    // Delete related records (order matters for foreign keys if not cascading)
    await photoService.deleteByBenchId(benchId);
    await ratingService.deleteByBenchId(benchId);
    await commentService.deleteByBenchId(benchId);
    await favoriteService.deleteByBenchId(benchId);

    // Finally delete the bench
    const { error } = await supabase
      .from('benches')
      .delete()
      .eq('id', benchId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  },
};

// ============================================================================
// PHOTO OPERATIONS
// ============================================================================

export const photoService = {
  /**
   * Get photos for a bench
   */
  async getByBenchId(benchId) {
    const { data, error } = await supabase
      .from('bench_photos')
      .select('*')
      .eq('bench_id', benchId)
      .order('is_primary', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Upload a photo to storage and create database record
   */
  async upload({ benchId, userId, photoData, mimeType, isPrimary = false }) {
    const fileExt = mimeType?.split('/')[1] || 'jpg';
    const fileName = `${userId}/${benchId}/${Date.now()}.${fileExt === 'jpeg' ? 'jpg' : fileExt}`;
    const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    // Convert base64 to Uint8Array
    const binaryString = atob(photoData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('bench-photos')
      .upload(fileName, bytes, {
        contentType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('bench-photos')
      .getPublicUrl(fileName);

    // Create database record
    const { data, error: dbError } = await supabase
      .from('bench_photos')
      .insert({
        bench_id: benchId,
        photo_url: publicUrl,
        is_primary: isPrimary,
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return data;
  },

  /**
   * Upload multiple photos
   */
  async uploadMultiple({ benchId, userId, photos }) {
    const uploadedPhotos = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      try {
        const uploaded = await this.upload({
          benchId,
          userId,
          photoData: photo.base64,
          mimeType: photo.mimeType,
          isPrimary: i === 0,
        });
        uploadedPhotos.push(uploaded);
      } catch (error) {
        console.error(`Error uploading photo ${i}:`, error);
        // Continue with other photos
      }
    }

    return uploadedPhotos;
  },

  /**
   * Delete photos from storage
   */
  async deleteFromStorage(photos) {
    const paths = photos.map(photo => {
      const urlParts = photo.photo_url.split('/bench-photos/');
      return urlParts[1];
    });

    const { error } = await supabase.storage
      .from('bench-photos')
      .remove(paths);

    if (error) {
      console.error('Error deleting photos from storage:', error);
    }
  },

  /**
   * Delete photo database records by bench ID
   */
  async deleteByBenchId(benchId) {
    const { error } = await supabase
      .from('bench_photos')
      .delete()
      .eq('bench_id', benchId);

    if (error) {
      console.error('Error deleting photos:', error);
    }
  },

  /**
   * Delete a single photo by ID (from both storage and database)
   */
  async delete(photoId) {
    // First get the photo to get the URL for storage deletion
    const { data: photo, error: fetchError } = await supabase
      .from('bench_photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    if (photo?.photo_url) {
      const urlParts = photo.photo_url.split('/bench-photos/');
      if (urlParts[1]) {
        await supabase.storage
          .from('bench-photos')
          .remove([urlParts[1]]);
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('bench_photos')
      .delete()
      .eq('id', photoId);

    if (error) throw error;
    return true;
  },

  /**
   * Set a photo as the primary photo for a bench
   */
  async setPrimary(photoId, benchId) {
    // First, unset all primary photos for this bench
    const { error: unsetError } = await supabase
      .from('bench_photos')
      .update({ is_primary: false })
      .eq('bench_id', benchId);

    if (unsetError) throw unsetError;

    // Then set the new primary
    const { data, error } = await supabase
      .from('bench_photos')
      .update({ is_primary: true })
      .eq('id', photoId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================================================
// RATING OPERATIONS
// ============================================================================

export const ratingService = {
  /**
   * Get ratings for a bench
   */
  async getByBenchId(benchId) {
    const { data, error } = await supabase
      .from('bench_ratings')
      .select('*')
      .eq('bench_id', benchId);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a user's rating for a bench
   */
  async getUserRating(benchId, userId) {
    const { data, error } = await supabase
      .from('bench_ratings')
      .select('*')
      .eq('bench_id', benchId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  /**
   * Add or update a rating
   */
  async upsert({ benchId, userId, viewRating, comfortRating }) {
    // Validate rating values
    const validatedRating = validateOrThrow(ratingSchema, {
      viewRating,
      comfortRating,
    });

    const { data, error } = await supabase
      .from('bench_ratings')
      .upsert({
        bench_id: benchId,
        user_id: userId,
        view_rating: validatedRating.viewRating,
        comfort_rating: validatedRating.comfortRating,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete ratings by bench ID (for bench deletion cleanup)
   */
  async deleteByBenchId(benchId) {
    const { error } = await supabase
      .from('bench_ratings')
      .delete()
      .eq('bench_id', benchId);

    if (error) {
      console.error('Error deleting ratings:', error);
    }
  },
};

// ============================================================================
// COMMENT OPERATIONS
// ============================================================================

export const commentService = {
  /**
   * Get comments for a bench with user profiles
   */
  async getByBenchId(benchId) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('bench_id', benchId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Add a comment (UPDATED to support replies and mentions)
   */
  async create({ benchId, userId, text, parentId = null }) {
    // Validate comment data
    const validatedComment = validateOrThrow(commentCreateSchema, {
      text,
      parentId,
    });

    const { data, error } = await supabase
      .from('comments')
      .insert({
        bench_id: benchId,
        user_id: userId,
        text: validatedComment.text,
        parent_id: validatedComment.parentId,
      })
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    // Create notification for bench owner (if not commenting on own bench)
    const { data: bench } = await supabase
      .from('benches')
      .select('user_id')
      .eq('id', benchId)
      .single();

    if (bench && bench.user_id !== userId) {
      await notificationService.create({
        userId: bench.user_id,
        actorId: userId,
        type: 'comment',
        benchId: benchId,
      });
    }

    // If this is a reply, create notification for parent comment author
    if (parentId) {
      const { data: parentComment } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', parentId)
        .single();

      if (parentComment && parentComment.user_id !== userId) {
        await notificationService.create({
          userId: parentComment.user_id,
          actorId: userId,
          type: 'reply',
          benchId: benchId,
          commentId: parentId,
        });
      }
    }

    // Check for mentions and create notifications
    await mentionService.createMentionNotifications(text, userId, benchId, data.id);

    return data;
  },

  /**
   * Delete a comment
   */
  async delete(commentId, userId) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  },

  /**
   * Delete comments by bench ID (for bench deletion cleanup)
   */
  async deleteByBenchId(benchId) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('bench_id', benchId);

    if (error) {
      console.error('Error deleting comments:', error);
    }
  },
};

// ============================================================================
// COMMENT LIKES SERVICE (NEW)
// ============================================================================

export const commentLikeService = {
  /**
   * Toggle like on a comment
   */
  async toggle(commentId, userId) {
    const { data: existing } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Unlike
      await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);
      return false;
    } else {
      // Like
      await supabase
        .from('comment_likes')
        .insert({ comment_id: commentId, user_id: userId });

      // Get comment details for notification
      const { data: comment } = await supabase
        .from('comments')
        .select('user_id, bench_id')
        .eq('id', commentId)
        .single();

      // Create notification (will auto-skip if user likes own comment)
      if (comment) {
        await notificationService.create({
          userId: comment.user_id,
          actorId: userId,
          type: 'comment_like',
          benchId: comment.bench_id,
          commentId: commentId,
        });
      }

      return true;
    }
  },

  /**
   * Check if user has liked a comment
   */
  async isLiked(commentId, userId) {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  },

  /**
   * Get like count for a comment
   */
  async getCount(commentId) {
    const { count, error } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Get users who liked a comment
   */
  async getLikers(commentId) {
    const { data, error } = await supabase
      .from('comment_likes')
      .select(`
        user_id,
        created_at,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('comment_id', commentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// ============================================================================
// MENTION SERVICE (NEW)
// ============================================================================

export const mentionService = {
  /**
   * Extract mentions from text and create notifications
   */
  async createMentionNotifications(text, actorId, benchId, commentId = null) {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    if (mentions.length === 0) return;

    // Get user IDs for mentioned usernames
    const { data: users } = await supabase
      .from('profiles')
      .select('id, username')
      .in('username', mentions);

    if (!users || users.length === 0) return;

    // Create notifications for each mentioned user (except the actor)
    const notifications = users
      .filter(user => user.id !== actorId)
      .map(user => ({
        user_id: user.id,
        type: 'mention',
        actor_id: actorId,
        bench_id: benchId,
        comment_id: commentId,
      }));

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
  },
};

// ============================================================================
// FAVORITE OPERATIONS
// ============================================================================

export const favoriteService = {
  /**
   * Check if a bench is favorited by a user
   */
  async isFavorite(benchId, userId) {
    const { data, error } = await supabase
      .from('favorites')
      .select('bench_id')
      .eq('user_id', userId)
      .eq('bench_id', benchId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  /**
   * Get all favorites for a user with bench details
   */
  async getByUserId(userId) {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        bench_id,
        created_at,
        benches:bench_id (
          id,
          title,
          description,
          view_type,
          latitude,
          longitude,
          created_at,
          bench_photos (
            photo_url,
            is_primary
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter out any null benches (deleted)
    return (data || []).filter(f => f.benches !== null);
  },

  /**
   * Add a bench to favorites
   */
  async add(benchId, userId) {
    const { data, error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, bench_id: benchId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove a bench from favorites
   */
  async remove(benchId, userId) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('bench_id', benchId);

    if (error) throw error;
    return true;
  },

  /**
   * Toggle favorite status
   */
  async toggle(benchId, userId) {
    const isFav = await this.isFavorite(benchId, userId);

    if (isFav) {
      await this.remove(benchId, userId);
      return false;
    } else {
      await this.add(benchId, userId);
      return true;
    }
  },

  /**
   * Delete favorites by bench ID (for bench deletion cleanup)
   */
  async deleteByBenchId(benchId) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('bench_id', benchId);

    if (error) {
      console.error('Error deleting favorites:', error);
    }
  },

  /**
   * Get favorite status for multiple benches in a single query (batch operation)
   * @param {string[]} benchIds - Array of bench IDs to check
   * @param {string} userId - The user ID to check favorites for
   * @returns {Object} Map of benchId -> boolean (isFavorited)
   */
  async getStatusBatch(benchIds, userId) {
    if (!benchIds.length || !userId) return {};

    const { data, error } = await supabase
      .from('favorites')
      .select('bench_id')
      .eq('user_id', userId)
      .in('bench_id', benchIds);

    if (error) throw error;

    // Convert to map for O(1) lookup
    const favoritedSet = new Set((data || []).map(f => f.bench_id));
    const result = {};
    benchIds.forEach(id => {
      result[id] = favoritedSet.has(id);
    });
    return result;
  },

  /**
   * Get favorite counts for multiple benches in a single query (batch operation)
   * Uses aggregation to minimize database calls
   * @param {string[]} benchIds - Array of bench IDs
   * @returns {Object} Map of benchId -> count
   */
  async getCountBatch(benchIds) {
    if (!benchIds.length) return {};

    // Get all favorites for these benches
    const { data, error } = await supabase
      .from('favorites')
      .select('bench_id')
      .in('bench_id', benchIds);

    if (error) throw error;

    // Count favorites per bench
    const counts = {};
    benchIds.forEach(id => {
      counts[id] = 0;
    });
    (data || []).forEach(f => {
      counts[f.bench_id] = (counts[f.bench_id] || 0) + 1;
    });
    return counts;
  },

  /**
   * Combined batch operation to get both status and counts in minimal queries
   * @param {string[]} benchIds - Array of bench IDs
   * @param {string} userId - User ID to check favorites for
   * @returns {Object} { statuses: {benchId: boolean}, counts: {benchId: number} }
   */
  async getBatchData(benchIds, userId) {
    if (!benchIds.length) return { statuses: {}, counts: {} };

    // Single query to get all favorites for these benches
    const { data, error } = await supabase
      .from('favorites')
      .select('bench_id, user_id')
      .in('bench_id', benchIds);

    if (error) throw error;

    const statuses = {};
    const counts = {};

    // Initialize all benches
    benchIds.forEach(id => {
      statuses[id] = false;
      counts[id] = 0;
    });

    // Process results
    (data || []).forEach(f => {
      counts[f.bench_id] = (counts[f.bench_id] || 0) + 1;
      if (userId && f.user_id === userId) {
        statuses[f.bench_id] = true;
      }
    });

    return { statuses, counts };
  },
};

// ============================================================================
// FOLLOW OPERATIONS
// ============================================================================

export const followService = {
  /**
   * Check if a user is following another user
   */
  async isFollowing(followerId, followingId) {
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  /**
   * Get followers for a user with profile details
   */
  async getFollowers(userId) {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower_id,
        created_at,
        profiles:follower_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).filter(f => f.profiles !== null);
  },

  /**
   * Get users that a user is following with profile details
   */
  async getFollowing(userId) {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following_id,
        created_at,
        profiles:following_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).filter(f => f.profiles !== null);
  },

  /**
   * Get follower and following counts
   */
  async getCounts(userId) {
    const [followersResult, followingResult] = await Promise.all([
      supabase
        .from('follows')
        .select('follower_id', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('follows')
        .select('following_id', { count: 'exact', head: true })
        .eq('follower_id', userId),
    ]);

    return {
      followers: followersResult.count || 0,
      following: followingResult.count || 0,
    };
  },

  /**
   * Follow a user
   */
  async follow(followerId, followingId) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const { data, error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Unfollow a user
   */
  async unfollow(followerId, followingId) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
    return true;
  },

  /**
   * Toggle follow status
   */
  async toggle(followerId, followingId) {
    const isFollowing = await this.isFollowing(followerId, followingId);

    if (isFollowing) {
      await this.unfollow(followerId, followingId);
      return false;
    } else {
      await this.follow(followerId, followingId);
      return true;
    }
  },
};

// ============================================================================
// PROFILE OPERATIONS
// ============================================================================

export const profileService = {
  /**
   * Get a profile by user ID
   */
  async getById(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get a profile by username
   */
  async getByUsername(username) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  /**
   * Check if username exists
   */
  async usernameExists(username) {
    const profile = await this.getByUsername(username);
    return !!profile;
  },

  /**
   * Search users by username (NEW - for mentions)
   */
  async search(query) {
    if (!query || query.length < 2) {
      return [];
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${query}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  },

  /**
   * Update a user's profile
   */
  async update(userId, { fullName, bio, avatarUrl }) {
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Only include fields that are provided
    if (fullName !== undefined) updateData.full_name = fullName?.trim() || null;
    if (bio !== undefined) updateData.bio = bio?.trim() || null;
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Upload avatar image and update profile
   */
  async uploadAvatar(userId, base64Data, mimeType = 'image/jpeg') {
    const fileExt = mimeType.split('/')[1] || 'jpg';
    const fileName = `${userId}/avatar_${Date.now()}.${fileExt === 'jpeg' ? 'jpg' : fileExt}`;
    const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, bytes, {
        contentType,
        upsert: true, // Overwrite if exists
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update profile with new avatar URL
    await this.update(userId, { avatarUrl: publicUrl });

    return publicUrl;
  },

  /**
   * Delete old avatar from storage
   */
  async deleteAvatar(avatarUrl) {
    if (!avatarUrl) return;

    try {
      const bucketPath = avatarUrl.split('/avatars/')[1];
      if (bucketPath) {
        await supabase.storage.from('avatars').remove([bucketPath]);
      }
    } catch (error) {
      console.error('Error deleting old avatar:', error);
      // Don't throw - continue even if cleanup fails
    }
  },

  /**
   * Get user stats (including follow counts)
   */
  async getStats(userId) {
    const [benchesResult, ratingsResult, commentsResult, favoritesResult, followCounts] = await Promise.all([
      supabase
        .from('benches')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('bench_ratings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('favorites')
        .select('bench_id', { count: 'exact', head: true })
        .eq('user_id', userId),
      followService.getCounts(userId),
    ]);

    return {
      benchesAdded: benchesResult.count || 0,
      ratingsGiven: ratingsResult.count || 0,
      commentsPosted: commentsResult.count || 0,
      favorites: favoritesResult.count || 0,
      followers: followCounts.followers,
      following: followCounts.following,
    };
  },
};

// ============================================================================
// NOTIFICATION OPERATIONS
// ============================================================================

export const notificationService = {
  /**
   * Get notifications for a user
   */
  async getByUserId(userId, { limit = 50, unreadOnly = false } = {}) {
    let query = supabase
      .from('notifications')
      .select(`
        *,
        actor:actor_id (
          id,
          username,
          avatar_url
        ),
        bench:bench_id (
          id,
          title
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Create a notification
   */
  async create({ userId, actorId, type, benchId = null, commentId = null }) {
    // Don't notify yourself
    if (userId === actorId) return null;

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        actor_id: actorId,
        type,
        bench_id: benchId,
        comment_id: commentId,
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return true;
  },

  /**
   * Delete old notifications (cleanup)
   */
  async deleteOld(userId, daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;
    return true;
  },
};


// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Export utility functions for testing
export { calculateDistance, toRadians };

// ============================================================================
// DEFAULT EXPORT - All services bundled
// ============================================================================

const api = {
  benches: benchService,
  photos: photoService,
  ratings: ratingService,
  comments: commentService,
  commentLikes: commentLikeService,
  mentions: mentionService,
  favorites: favoriteService,
  follows: followService,
  profiles: profileService,
  notifications: notificationService,
};

export default api;