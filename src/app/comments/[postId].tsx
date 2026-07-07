import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSession } from '@/features/auth/useSession';
import {
  pickCommentImage,
  takeCommentPhoto,
  uploadCommentImage,
} from '@/features/feed/commentMedia';
import {
  useAddComment,
  useComments,
  useToggleCommentLike,
  type CommentView,
} from '@/features/feed/useFeed';
import { useProfile } from '@/features/profile/useProfile';
import { colors, radii, spacing, textStyles } from '@/theme';

const MAX_COMMENT_LENGTH = 500;

interface ReplyTarget {
  /** Top-level thread the reply lands in (replies to replies stay flat). */
  threadId: string;
  name: string;
}

function CommentRow({
  comment,
  isReply,
  onLike,
  onReply,
}: {
  comment: CommentView;
  isReply: boolean;
  onLike: () => void;
  onReply: () => void;
}) {
  const name = comment.display_name || comment.username;
  return (
    <View style={[styles.row, isReply && styles.rowReply]}>
      <View style={[styles.avatar, isReply && styles.avatarSmall]}>
        <Text style={[textStyles.headerS, styles.avatarLetter]}>
          {(name || '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.commentBlock}>
        <Text style={[textStyles.caption, styles.name]}>{name}</Text>
        {comment.body.length > 0 && (
          <Text style={[textStyles.body, styles.body]}>{comment.body}</Text>
        )}
        {comment.media_url && (
          <Image
            source={{ uri: comment.media_url }}
            style={styles.commentImage}
            resizeMode="cover"
            accessibilityLabel={`Image comment by ${name}`}
          />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Reply to ${name}`}
          onPress={onReply}
          hitSlop={8}
          style={styles.replyButton}
        >
          <Text style={[textStyles.caption, styles.replyLabel]}>Reply</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={comment.viewer_liked ? 'Unlike comment' : 'Like comment'}
        accessibilityState={{ selected: comment.viewer_liked }}
        onPress={onLike}
        hitSlop={10}
        style={styles.likeColumn}
      >
        <Ionicons
          name={comment.viewer_liked ? 'heart' : 'heart-outline'}
          size={16}
          color={comment.viewer_liked ? colors.primary : colors.textSecondary}
        />
        {comment.like_count > 0 && (
          <Text style={[textStyles.caption, styles.likeCount]}>{comment.like_count}</Text>
        )}
      </Pressable>
    </View>
  );
}

/**
 * Comment sheet (M6.1 founder feedback): opens as a formSheet over the feed
 * (post stays visible above; drag down to see more of it / dismiss), threaded
 * comments with likes + replies, and an IG-style composer — gallery/camera
 * icons that become a send arrow once there's something to send.
 */
export default function CommentsScreen() {
  const { postId, name: posterName } = useLocalSearchParams<{
    postId: string;
    name?: string;
  }>();
  const { session } = useSession();
  const userId = session?.user.id;
  const { data: myProfile } = useProfile(userId);

  const [draft, setDraft] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [sending, setSending] = useState(false);

  const { data: comments, isLoading, error } = useComments(postId);
  const addComment = useAddComment(userId);
  const toggleLike = useToggleCommentLike(userId);

  const topLevel = (comments ?? []).filter((c) => c.parent_comment_id === null);
  const repliesOf = (id: string) =>
    (comments ?? []).filter((c) => c.parent_comment_id === id);

  const like = (comment: CommentView) =>
    toggleLike.mutate({
      postId,
      commentId: comment.id,
      liked: comment.viewer_liked,
    });

  const startReply = (comment: CommentView) =>
    setReplyTo({
      threadId: comment.parent_comment_id ?? comment.id,
      name: comment.display_name || comment.username,
    });

  const attachImage = async (source: 'gallery' | 'camera') => {
    try {
      const uri = source === 'gallery' ? await pickCommentImage() : await takeCommentPhoto();
      if (uri) setImageUri(uri);
    } catch (e) {
      Alert.alert('Cannot attach photo', e instanceof Error ? e.message : 'Try again.');
    }
  };

  const canSend = (draft.trim().length > 0 || imageUri !== null) && !sending;

  const send = async () => {
    if (!canSend || !userId) return;
    setSending(true);
    try {
      const mediaPath = imageUri ? await uploadCommentImage(userId, imageUri) : undefined;
      await addComment.mutateAsync({
        postId,
        body: draft.trim(),
        parentId: replyTo?.threadId,
        mediaPath,
      });
      setDraft('');
      setImageUri(null);
      setReplyTo(null);
    } catch (e) {
      Alert.alert('Comment not posted', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ErrorBoundary screen="Comments">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={[textStyles.headerS, styles.title]}>Comments</Text>

        <FlatList
          data={topLevel}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View>
              <CommentRow
                comment={item}
                isReply={false}
                onLike={() => like(item)}
                onReply={() => startReply(item)}
              />
              {repliesOf(item.id).map((reply) => (
                <CommentRow
                  key={reply.id}
                  comment={reply}
                  isReply
                  onLike={() => like(reply)}
                  onReply={() => startReply(reply)}
                />
              ))}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[textStyles.headerL, styles.emptyTitle]}>
                {isLoading ? 'Loading…' : error ? 'Could not load comments' : 'No comments yet'}
              </Text>
              {!isLoading && !error && (
                <Text style={[textStyles.body, styles.emptyCopy]}>
                  {posterName
                    ? `Be the first to cheer ${posterName} on.`
                    : 'Be the first to comment.'}
                </Text>
              )}
            </View>
          }
        />

        {replyTo && (
          <View style={styles.replyBar}>
            <Text style={[textStyles.caption, styles.replyBarText]} numberOfLines={1}>
              Replying to {replyTo.name}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel reply"
              onPress={() => setReplyTo(null)}
              hitSlop={10}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        )}

        {imageUri && (
          <View style={styles.imagePreviewBar}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove attached photo"
              onPress={() => setImageUri(null)}
              style={styles.imageRemove}
              hitSlop={10}
            >
              <Ionicons name="close" size={16} color={colors.textOnDark} />
            </Pressable>
          </View>
        )}

        <View style={styles.composer}>
          <View style={styles.avatar}>
            <Text style={[textStyles.headerS, styles.avatarLetter]}>
              {(myProfile?.display_name || myProfile?.username || '?')
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>
          <View style={styles.inputPill}>
            <TextInput
              style={[textStyles.body, styles.input]}
              value={draft}
              onChangeText={setDraft}
              placeholder={replyTo ? `Reply to ${replyTo.name}…` : 'Add a comment…'}
              placeholderTextColor={colors.textSecondary}
              maxLength={MAX_COMMENT_LENGTH}
              multiline
              accessibilityLabel="Comment text"
            />
            {draft.trim().length === 0 && imageUri === null ? (
              <View style={styles.pillIcons}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Reply with a photo from your gallery"
                  onPress={() => void attachImage('gallery')}
                  hitSlop={8}
                  style={styles.pillIcon}
                >
                  <Ionicons name="image-outline" size={22} color={colors.textSecondary} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Reply with a photo you take now"
                  onPress={() => void attachImage('camera')}
                  hitSlop={8}
                  style={styles.pillIcon}
                >
                  <Ionicons name="camera-outline" size={22} color={colors.textSecondary} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send comment"
                disabled={!canSend}
                onPress={() => void send()}
                style={[styles.sendButton, !canSend && styles.sendDisabled]}
                hitSlop={8}
              >
                <Ionicons name="arrow-up" size={18} color={colors.textOnPrimary} />
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.textPrimary,
    textAlign: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowReply: {
    marginLeft: spacing.xl,
    marginTop: spacing.xs,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarLetter: {
    color: colors.textPrimary,
  },
  commentBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.textSecondary,
  },
  body: {
    color: colors.textPrimary,
  },
  commentImage: {
    width: 180,
    height: 180,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceNature,
    marginTop: spacing.xxs,
  },
  replyButton: {
    minHeight: 28,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  replyLabel: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  likeColumn: {
    alignItems: 'center',
    gap: 2,
    minWidth: 32,
    paddingTop: spacing.xxs,
  },
  likeCount: {
    color: colors.textSecondary,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.textPrimary,
  },
  emptyCopy: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  replyBarText: {
    flex: 1,
    color: colors.textSecondary,
  },
  imagePreviewBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  imagePreview: {
    width: 72,
    height: 72,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceNature,
  },
  imageRemove: {
    position: 'absolute',
    top: spacing.xxs,
    left: spacing.md + 72 - 20,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xxs,
    paddingVertical: spacing.xxs,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    color: colors.textPrimary,
    paddingVertical: spacing.xxs,
  },
  pillIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingBottom: 2,
  },
  pillIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendDisabled: {
    opacity: 0.5,
  },
});
