import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

function BenchInfo({ 
  bench, 
  creator, 
  isOwner,
  user,
  isFollowingCreator,
  onFollowToggle,
  followLoading,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();

  const handleCreatorPress = () => {
    if (creator?.id) {
      navigation.navigate('UserProfile', { userId: creator.id });
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.viewType}>{bench.view_type}</Text>
      <Text style={styles.benchTitle}>{bench.title}</Text>

      {creator && (
        <View style={localStyles.creatorContainer}>
          {/* Tappable creator info */}
          <TouchableOpacity 
            style={localStyles.creatorRow}
            onPress={handleCreatorPress}
            activeOpacity={0.7}
          >
            {creator.avatar_url ? (
              <Image source={{ uri: creator.avatar_url }} style={localStyles.creatorAvatar} />
            ) : (
              <View style={[localStyles.creatorAvatarPlaceholder, { backgroundColor: colors.surface }]}>
                <Ionicons name="person" size={10} color={colors.icon.secondary} />
              </View>
            )}
            <Text style={[styles.creator, localStyles.creatorText]}>
              @{creator.username || 'anonymous'}
            </Text>
          </TouchableOpacity>

          {/* Follow button - only show if not owner and logged in */}
          {user && !isOwner && onFollowToggle && (
            <TouchableOpacity
              style={[localStyles.followButton, {
                backgroundColor: isFollowingCreator ? 'transparent' : colors.button.primary,
                borderColor: colors.button.primary,
                borderWidth: isFollowingCreator ? 1 : 0,
              }]}
              onPress={onFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator 
                  size="small" 
                  color={isFollowingCreator ? colors.text.primary : colors.button.primaryText} 
                />
              ) : (
                <>
                  <Ionicons
                    name={isFollowingCreator ? "checkmark" : "person-add-outline"}
                    size={12}
                    color={isFollowingCreator ? colors.text.primary : colors.button.primaryText}
                  />
                  <Text style={[localStyles.followButtonText, {
                    color: isFollowingCreator ? colors.text.primary : colors.button.primaryText,
                  }]}>
                    {isFollowingCreator ? 'following' : 'follow'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {bench.description && (
        <Text style={styles.description}>{bench.description}</Text>
      )}

      {bench.accessibility_notes && (
        <Text style={styles.accessibility}>{bench.accessibility_notes}</Text>
      )}
    </View>
  );
}

const localStyles = {
creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginTop: 10, // Increased slightly for better breathing room
    minHeight: 32, 
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center', // This aligns children (avatar & text) to the center line
    gap: 8,
    flexShrink: 1,
  },
  creatorText: {
    fontSize: 14,
    fontWeight: '500',
    includeFontPadding: false, // CRITICAL: Removes extra padding on Android
    textAlignVertical: 'center', // Centers text within its box on Android
    // REMOVE lineHeight: 20 if it still looks off, let the container center it
  },
   creatorAvatar: {
    width: 22, // Sized up slightly to look better next to text
    height: 22,
    borderRadius: 11,
  },
  creatorAvatarPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorText: {
    // REMOVE lineHeight: 20
    fontSize: 14,
    fontWeight: '500',
    includeFontPadding: false, // Fixes Android vertical alignment
    textAlignVertical: 'center',
    marginTop: 14, // Visual "nudge" to account for font descenders
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4, // Slightly reduced to keep it slim on the line
    borderRadius: 14,
    marginLeft: 10, // Added space between name and button
  },
  followButtonText: {
    fontSize: 11,
    fontWeight: '600',
    includeFontPadding: false, // Prevents extra space on Android
    textAlignVertical: 'center',
  },
};

// Memoize to prevent unnecessary re-renders
export default React.memo(BenchInfo, (prevProps, nextProps) => {
  return (
    prevProps.bench?.id === nextProps.bench?.id &&
    prevProps.bench?.title === nextProps.bench?.title &&
    prevProps.bench?.description === nextProps.bench?.description &&
    prevProps.creator?.id === nextProps.creator?.id &&
    prevProps.isOwner === nextProps.isOwner &&
    prevProps.user?.id === nextProps.user?.id &&
    prevProps.isFollowingCreator === nextProps.isFollowingCreator &&
    prevProps.followLoading === nextProps.followLoading
  );
});