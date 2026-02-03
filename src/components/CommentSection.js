import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, FlatList, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getStyles } from '../styles';

// User mention autocomplete component
function MentionAutocomplete({ searchText, onSelectUser, colors }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const searchUsers = async () => {
      if (!searchText || searchText.length < 2) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        // Import api service
        const api = require('../services/api').default;
        const results = await api.profiles.search(searchText);
        setUsers(results.slice(0, 5)); // Limit to 5 results
      } catch (error) {
        console.error('Error searching users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchText]);

  if (!searchText || users.length === 0) return null;

  return (
    <View style={[localStyles.mentionDropdown, { backgroundColor: colors.card.background, borderColor: colors.border }]}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.icon.primary} style={{ padding: 10 }} />
      ) : (
        users.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={localStyles.mentionItem}
            onPress={() => onSelectUser(user)}
          >
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={localStyles.mentionAvatar} />
            ) : (
              <View style={[localStyles.mentionAvatarPlaceholder, { backgroundColor: colors.surface }]}>
                <Ionicons name="person" size={12} color={colors.icon.secondary} />
              </View>
            )}
            <Text style={[localStyles.mentionUsername, { color: colors.text.primary }]}>
              @{user.username}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

// Individual comment component - memoized to prevent re-renders in list
const CommentItem = React.memo(function CommentItem({
  comment,
  user,
  colors,
  styles,
  onReply,
  onLike,
  onUserPress,
  isReply = false,
  level = 0
}) {
  const [showReplies, setShowReplies] = useState(true);

  const handleLike = () => {
    if (onLike) {
      onLike(comment.id);
    }
  };

  const isLiked = comment.user_has_liked;
  const likeCount = comment.like_count || 0;

  // Parse text for mentions
  const renderTextWithMentions = (text) => {
    if (!text) return null;

    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${lastIndex}`} style={styles.commentText}>
            {text.substring(lastIndex, match.index)}
          </Text>
        );
      }

      parts.push(
        <Text
          key={`mention-${match.index}`}
          style={[styles.commentText, { color: colors.button.primary, fontWeight: '600' }]}
          onPress={() => onUserPress({ username })} // <-- ADD THIS
        >
          @{username}
        </Text>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(
        <Text key={`text-${lastIndex}`} style={styles.commentText}>
          {text.substring(lastIndex)}
        </Text>
      );
    }

    return parts.length > 0 ? <Text>{parts}</Text> : <Text style={styles.commentText}>{text}</Text>;
  };

  return (
    <View style={[localStyles.commentWrapper, isReply && { marginLeft: 30 }]}>
      <View style={styles.comment}>
        <TouchableOpacity
          style={localStyles.commentHeader}
          // Update the author click to pass an object
          onPress={() => onUserPress({ userId: comment.profiles?.id })}
          activeOpacity={0.7}
        >
          {comment.profiles?.avatar_url ? (
            <Image
              source={{ uri: comment.profiles.avatar_url }}
              style={localStyles.commentAvatar}
            />
          ) : (
            <View style={[localStyles.commentAvatarPlaceholder, { backgroundColor: colors.surface }]}>
              <Ionicons name="person" size={10} color={colors.icon.secondary} />
            </View>
          )}
          <Text style={styles.commentUser}>@{comment.profiles?.username}</Text>
          {comment.parent_id && (
            <Ionicons name="arrow-undo" size={10} color={colors.text.tertiary} style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>

        <View style={localStyles.commentTextRow}>
          <View style={{ flex: 1 }}>
            {renderTextWithMentions(comment.text)}
          </View>

          {/* Like button - positioned on the right of text */}
          {user && (
            <TouchableOpacity
              style={localStyles.likeButton}
              onPress={handleLike}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={16}
                color={isLiked ? colors.destructive : colors.text.tertiary}
              />
              {likeCount > 0 && (
                <Text style={[localStyles.likeCountText, { color: colors.text.tertiary }]}>
                  {likeCount}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={localStyles.commentActions}>
          <View style={localStyles.commentActionsLeft}>
            <Text style={styles.commentDate}>
              {new Date(comment.created_at).toLocaleDateString()}
            </Text>

            {/* Reply button */}
            {user && !isReply && level < 2 && (
              <TouchableOpacity
                style={localStyles.actionButton}
                onPress={() => onReply(comment)}
              >
                <Ionicons name="arrow-undo-outline" size={14} color={colors.text.tertiary} />
                <Text style={[localStyles.actionText, { color: colors.text.tertiary }]}>
                  reply
                </Text>
              </TouchableOpacity>
            )}

            {/* Show/hide replies button */}
            {comment.replies && comment.replies.length > 0 && (
              <TouchableOpacity
                style={localStyles.actionButton}
                onPress={() => setShowReplies(!showReplies)}
              >
                <Ionicons
                  name={showReplies ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={colors.text.tertiary}
                />
                <Text style={[localStyles.actionText, { color: colors.text.tertiary }]}>
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Render replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <View>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              user={user}
              colors={colors}
              styles={styles}
              onReply={onReply}
              onLike={onLike}
              onUserPress={onUserPress}
              isReply={true}
              level={level + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for comment re-renders
  return (
    prevProps.comment.id === nextProps.comment.id &&
    prevProps.comment.text === nextProps.comment.text &&
    prevProps.comment.like_count === nextProps.comment.like_count &&
    prevProps.comment.user_has_liked === nextProps.comment.user_has_liked &&
    prevProps.comment.replies?.length === nextProps.comment.replies?.length &&
    prevProps.user?.id === nextProps.user?.id &&
    prevProps.isReply === nextProps.isReply &&
    prevProps.level === nextProps.level
  );
});

export default function CommentSection({
  comments,
  user,
  commentText,
  onCommentTextChange,
  onAddComment,
  submittingComment,
  onLikeComment,
  onReplyToComment
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();

  const [replyingTo, setReplyingTo] = useState(null);
  const [mentionSearch, setMentionSearch] = useState('');

  const handleUserPress = (userParams) => {

  if (userParams && (userParams.userId || userParams.username)) {
    navigation.navigate('UserProfile', userParams);
  }
};

  const handleTextChange = (text) => {
    onCommentTextChange(text);

    // Check for @ mention
    const lastAtSymbol = text.lastIndexOf('@');
    if (lastAtSymbol !== -1) {
      const textAfterAt = text.substring(lastAtSymbol + 1);
      // Only search if there's no space after @
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt);
      } else {
        setMentionSearch('');
      }
    } else {
      setMentionSearch('');
    }
  };

  const handleSelectUser = (user) => {
    const lastAtSymbol = commentText.lastIndexOf('@');
    const beforeMention = commentText.substring(0, lastAtSymbol);
    const newText = beforeMention + '@' + user.username + ' ';
    onCommentTextChange(newText);
    setMentionSearch('');
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    // Pre-fill with mention
    onCommentTextChange(`@${comment.profiles?.username} `);
  };

  const handleSubmitComment = () => {
    if (replyingTo) {
      onReplyToComment(replyingTo.id, commentText);
      setReplyingTo(null);
    } else {
      onAddComment();
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    onCommentTextChange('');
  };

  // Organize comments into threads
  const threaded = comments.reduce((acc, comment) => {
    if (!comment.parent_id) {
      // Top-level comment
      acc.push({
        ...comment,
        replies: comments.filter(c => c.parent_id === comment.id)
      });
    }
    return acc;
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>
        comments ({comments.length})
      </Text>

      {user && (
        <View>
          {replyingTo && (
            <View style={[localStyles.replyingToBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[localStyles.replyingToText, { color: colors.text.secondary }]}>
                replying to @{replyingTo.profiles?.username}
              </Text>
              <TouchableOpacity onPress={handleCancelReply}>
                <Ionicons name="close" size={18} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.commentInputWrapper}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={styles.commentInput}
                placeholder={replyingTo ? "write a reply..." : "add a comment..."}
                placeholderTextColor={colors.input.placeholder}
                value={commentText}
                onChangeText={handleTextChange}
                multiline
              />
              <MentionAutocomplete
                searchText={mentionSearch}
                onSelectUser={handleSelectUser}
                colors={colors}
              />
            </View>
            <TouchableOpacity
              style={styles.commentButton}
              onPress={handleSubmitComment}
              disabled={submittingComment || !commentText.trim()}
            >
              {submittingComment ? (
                <ActivityIndicator color={colors.button.primaryText} size="small" />
              ) : (
                <Text style={styles.commentButtonText}>
                  {replyingTo ? 'reply' : 'post'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {threaded.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          user={user}
          colors={colors}
          styles={styles}
          onReply={handleReply}
          onLike={onLikeComment}
          onUserPress={handleUserPress}
        />
      ))}

      {comments.length === 0 && (
        <Text style={styles.emptyText}>no comments yet</Text>
      )}
    </View>
  );
}

const localStyles = {
  commentWrapper: {
    marginBottom: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  commentTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
  },
  likeCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  commentAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  commentAvatarPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  commentActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  replyingToBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 13,
    fontWeight: '500',
  },
  mentionDropdown: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
    maxHeight: 200,
    zIndex: 1000,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  mentionAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  mentionAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentionUsername: {
    fontSize: 14,
    fontWeight: '500',
  },
};