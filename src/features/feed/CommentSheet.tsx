import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type KeyboardEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';

import { PressButton } from '@/components/ui/PressButton';
import type { CommentView } from '@/features/feed/useFeed';
import { colors, radii, spacing, textStyles } from '@/theme';

const MAX_COMMENT_LENGTH = 500;

/**
 * LAYOUT CONTRACT (SDK 54 / react-native-screens 4.16 — do not "simplify"
 * back to a flex column until the SDK 55+ upgrade):
 *
 * On iOS, a numeric-detent formSheet renders its content into a wrapper
 * styled `position: absolute; top: 0` with NO height (ScreenStackItem.js) —
 * the wrapper hugs its children, so `flex: 1` / `height: '100%'` cannot fill
 * the sheet, and native code (RNSScreenContentWrapper.mm) force-frames a
 * direct-child ScrollView to the sheet's size behind Yoga's back. This sheet
 * therefore uses only mechanisms that version verifiably supports:
 *
 * 1. The FlatList is the wrapper's FIRST direct child → the native
 *    coercion sizes it to the full sheet at every detent ("Case 1").
 * 2. The "Comments" title is a sticky in-list header → it occupies list
 *    space and can never be overlapped by the first row.
 * 3. The composer lives in a FullWindowOverlay pinned to the WINDOW bottom.
 *    An iPhone sheet's bottom edge is always the window's bottom edge, at
 *    every detent, so the composer is flush without knowing the sheet
 *    height; the keyboard is tracked in the same window coordinates.
 */

/** Keyboard overlap height in window coordinates (0 when hidden). */
function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const onFrame = (event: KeyboardEvent) => {
      const windowHeight = Dimensions.get('window').height;
      setHeight(Math.max(0, windowHeight - event.endCoordinates.screenY));
    };
    if (Platform.OS === 'ios') {
      // Covers show, hide, and height changes (emoji keyboard etc.).
      const sub = Keyboard.addListener('keyboardWillChangeFrame', onFrame);
      return () => sub.remove();
    }
    const show = Keyboard.addListener('keyboardDidShow', onFrame);
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

interface ReplyTarget {
  /** Top-level thread the reply lands in (replies to replies stay flat). */
  threadId: string;
  name: string;
}

export interface CommentSendInput {
  body: string;
  /** Top-level comment id the reply belongs to; absent for new threads. */
  parentThreadId?: string;
  /** Local image URI to upload alongside (or instead of) text. */
  imageUri: string | null;
}

export interface CommentSheetProps {
  comments: CommentView[] | undefined;
  isLoading: boolean;
  hasError: boolean;
  isRefetching: boolean;
  onRetry: () => void;
  posterName?: string;
  /** Uppercase initial for the viewer's composer avatar. */
  myInitial: string;
  onToggleLike: (comment: CommentView) => void;
  onSend: (input: CommentSendInput) => Promise<void>;
  /** Both return a local URI, or null if the user cancels. */
  onPickImage: () => Promise<string | null>;
  onTakePhoto: () => Promise<string | null>;
  /** Dev preview only: raise the keyboard on mount. */
  autoFocusInput?: boolean;
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
 * Comment sheet (M6.1 + founder fix passes): threaded comments with likes +
 * replies and an IG-style composer, laid out per the LAYOUT CONTRACT above.
 */
export function CommentSheet({
  comments,
  isLoading,
  hasError,
  isRefetching,
  onRetry,
  posterName,
  myInitial,
  onToggleLike,
  onSend,
  onPickImage,
  onTakePhoto,
  autoFocusInput = false,
}: CommentSheetProps) {
  const [draft, setDraft] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [sending, setSending] = useState(false);
  const [dockHeight, setDockHeight] = useState(0);

  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const { height: windowHeight } = useWindowDimensions();

  // Idle: flush above the home indicator. Keyboard up: the dock is lifted
  // onto the keyboard, so only a hair of padding remains (iMessage feel).
  const dockPadBottom =
    keyboardHeight > 0 ? spacing.xs : Math.max(insets.bottom, spacing.xs);

  const topLevel = (comments ?? []).filter((c) => c.parent_comment_id === null);
  const repliesOf = (id: string) =>
    (comments ?? []).filter((c) => c.parent_comment_id === id);

  const startReply = (comment: CommentView) =>
    setReplyTo({
      threadId: comment.parent_comment_id ?? comment.id,
      name: comment.display_name || comment.username,
    });

  const attachImage = async (source: 'gallery' | 'camera') => {
    try {
      const uri = source === 'gallery' ? await onPickImage() : await onTakePhoto();
      if (uri) setImageUri(uri);
    } catch (e) {
      Alert.alert('Cannot attach photo', e instanceof Error ? e.message : 'Try again.');
    }
  };

  const canSend = (draft.trim().length > 0 || imageUri !== null) && !sending;

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await onSend({
        body: draft.trim(),
        parentThreadId: replyTo?.threadId,
        imageUri,
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
    <>
      <FlatList
        data={topLevel}
        keyExtractor={(c) => c.id}
        // Yoga height overshoots the sheet on purpose; the native Case-1
        // coercion sets the real frame. Oversizing only makes the list
        // render a few extra rows — undersizing would blank them.
        style={[styles.list, { height: windowHeight }]}
        contentContainerStyle={[
          styles.listContent,
          // Keep the thread's tail clear of the floating dock + keyboard.
          { paddingBottom: dockHeight + keyboardHeight + spacing.sm },
        ]}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[textStyles.headerS, styles.title]}>Comments</Text>
          </View>
        }
        stickyHeaderIndices={[0]}
        renderItem={({ item }) => (
          <View style={styles.thread}>
            <CommentRow
              comment={item}
              isReply={false}
              onLike={() => onToggleLike(item)}
              onReply={() => startReply(item)}
            />
            {repliesOf(item.id).map((reply) => (
              <CommentRow
                key={reply.id}
                comment={reply}
                isReply
                onLike={() => onToggleLike(reply)}
                onReply={() => startReply(reply)}
              />
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            {isLoading ? (
              <Text style={[textStyles.headerL, styles.emptyTitle]}>Loading…</Text>
            ) : hasError ? (
              <>
                <Text style={[textStyles.headerL, styles.emptyTitle]}>
                  Comments didn’t load
                </Text>
                <Text style={[textStyles.body, styles.emptyCopy]}>
                  Check your connection and try again.
                </Text>
                <PressButton
                  label={isRefetching ? 'Retrying…' : 'Retry'}
                  onPress={onRetry}
                  disabled={isRefetching}
                  style={styles.retryButton}
                />
              </>
            ) : (
              <>
                <Text style={[textStyles.headerL, styles.emptyTitle]}>
                  No comments yet
                </Text>
                <Text style={[textStyles.body, styles.emptyCopy]}>
                  {posterName
                    ? `Be the first to cheer ${posterName} on.`
                    : 'Be the first to comment.'}
                </Text>
              </>
            )}
          </View>
        }
      />

      {/* Composer dock — window-bottom pinned (see LAYOUT CONTRACT). */}
      <FullWindowOverlay>
        <View style={styles.overlayRoot} pointerEvents="box-none">
          <View
            style={[
              styles.dock,
              {
                paddingBottom: dockPadBottom,
                transform: [{ translateY: -keyboardHeight }],
              },
            ]}
            onLayout={(e) => setDockHeight(e.nativeEvent.layout.height)}
          >
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
                <Text style={[textStyles.headerS, styles.avatarLetter]}>{myInitial}</Text>
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
                  autoFocus={autoFocusInput}
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
          </View>
        </View>
      </FullWindowOverlay>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    flexGrow: 1,
  },
  header: {
    // lg top padding clears the grabber UIKit draws over the sheet's top
    // edge; opaque background hides rows scrolling under the sticky title.
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  title: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  thread: {
    marginBottom: spacing.sm,
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
  retryButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
    minWidth: 160,
  },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  dock: {
    backgroundColor: colors.surface,
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
