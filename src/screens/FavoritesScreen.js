import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
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

export default function FavoritesScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await api.favorites.getByUserId(user.id);
      setFavorites(data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      Alert.alert('Error', 'Could not load favorites');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user, fetchFavorites]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user) {
        fetchFavorites();
      }
    });

    return unsubscribe;
  }, [navigation, user, fetchFavorites]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  };

  const removeFavorite = async (benchId, benchTitle) => {
    const confirmRemove = () => {
      return new Promise((resolve) => {
        if (typeof window !== 'undefined') {
          resolve(window.confirm(`remove "${benchTitle}" from favorites?`));
        } else {
          Alert.alert(
            'remove favorite',
            `remove "${benchTitle}" from favorites?`,
            [
              { text: 'cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'remove', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        }
      });
    };

    const shouldRemove = await confirmRemove();
    if (!shouldRemove) return;

    try {
      await api.favorites.remove(benchId, user.id);
      setFavorites(favorites.filter(f => f.bench_id !== benchId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Error', 'Could not remove favorite');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.icon.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>favorites</Text>
        <Text style={styles.count}>{favorites.length}</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.icon.primary}
            colors={[colors.icon.primary]}
          />
        }
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={48} color={colors.icon.muted} />
            <Text style={styles.emptyStateTitle}>no favorites yet</Text>
            <Text style={styles.emptyStateText}>
              tap the heart icon on benches you love
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate('Map')}
            >
              <Text style={styles.exploreButtonText}>explore benches</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.favoritesList}>
            {favorites.map((favorite) => {
              const bench = favorite.benches;
              const primaryPhoto = bench.bench_photos?.find(p => p.is_primary);
              
              return (
                <View key={`${favorite.bench_id}-${favorite.created_at}`} style={styles.favoriteCard}>
                  <TouchableOpacity
                    style={styles.benchContent}
                    onPress={() => navigation.navigate('BenchDetail', { benchId: bench.id })}
                  >
                    {primaryPhoto ? (
                      <Image
                        source={{ uri: primaryPhoto.photo_url }}
                        style={styles.benchImage}
                      />
                    ) : (
                      <View style={styles.benchImagePlaceholder}>
                        <Ionicons name="image-outline" size={24} color={colors.icon.muted} />
                      </View>
                    )}
                    
                    <View style={styles.benchInfo}>
                      <Text style={styles.benchViewType}>{bench.view_type}</Text>
                      <Text style={styles.benchTitle}>{bench.title}</Text>
                      
                      {bench.description && (
                        <Text style={styles.benchDescription} numberOfLines={2}>
                          {bench.description}
                        </Text>
                      )}
                      
                      <Text style={styles.savedDate}>
                        saved {new Date(favorite.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFavorite(bench.id, bench.title)}
                  >
                    <Ionicons name="heart" size={20} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
