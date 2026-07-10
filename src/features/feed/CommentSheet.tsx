import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type KeyboardEvent,
} from 'react-native';
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
  useReducedMotion,
} from 'react-native-reanimated';
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

/**
 * Keyboard clearance for the LIST's bottom padding — updated only once the
 * keyboard SETTLES, never mid-animation. (The old implementation animated
 * this per keyboard event with LayoutAnimation on the JS thread: state
 * change → dock relayout → onLayout → second state change → full thread-
 * list relayout, all racing UIKit's native sheet-with-keyboard slide — the
 * founder-reported stutter. The dock itself now rides the keyboard
 * per-frame on the UI thread via useAnimatedKeyboard below; this value only
 * keeps the thread's tail scrollable above the dock once things are still,
 * and that padding sits behind dock+keyboard, so a late single update is
 * invisible.)
 */
function useKeyboardClearance(): number {
  const [clearance, setClearance] = useState(0);
  useEffect(() => {
    if (Platform.OS === 'ios') {
      // Fires after show, hide, AND height changes (emoji keyboard etc.).
      const sub = Keyboard.addListener('keyboardDidChangeFrame', (event: KeyboardEvent) => {
        const windowHeight = Dimensions.get('window').height;
        setClearance(Math.max(0, windowHeight - event.endCoordinates.screenY));
      });
      return () => sub.remove();
    }
    const show = Keyboard.addListener('keyboardDidShow', (event: KeyboardEvent) =>
      setClearance(event.endCoordinates.height),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setClearance(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return clearance;
}

interface ReplyTarget {
  /** Top-level thread the reply lands in (replies to replies stay flat). */
  threadId: string;
  name: string;
}

/** A just-sent comment shown at reduced opacity until the server row lands
 *  (founder refinement 3 — IG-style posting feedback, no hard cut). */
interface PendingComment {
  body: string;
  imageUri: string | null;
  threadId?: string;
  /** Thread count at send time — the pending row clears once it grows. */
  countAtSend: number;
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
  /** Report a comment (spec §12) — omitted rows (own comments) show no action. */
  onReport?: (comment: CommentView) => void;
  /** Viewer's user id — hides Report on the viewer's own comments. */
  viewerId?: string;
  onSend: (input: CommentSendInput) => Promise<void>;
  /** Both return a local URI, or null if the user cancels. */
  onPickImage: () => Promise<string | null>;
  onTakePhoto: () => Promise<string | null>;
  /**
   * Input focus/blur — the route uses it to expand the sheet to the full
   * detent while typing (founder polish fix 3: tapping the input bar is a
   * second, equivalent full-expansion trigger).
   */
  onInputFocusChange?: (focused: boolean) => void;
  /** Dev preview only: raise the keyboard on mount. */
  autoFocusInput?: boolean;
}

function CommentRow({
  comment,
  isReply,
  onLike,
  onReply,
  onReport,
}: {
  comment: CommentView;
  isReply: boolean;
  onLike: () => void;
  onReply: () => void;
  onReport?: () => void;
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
        <View style={styles.rowActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Reply to ${name}`}
            onPress={onReply}
            hitSlop={8}
            style={styles.replyButton}
          >
            <Text style={[textStyles.caption, styles.replyLabel]}>Reply</Text>
          </Pressable>
          {onReport && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Report comment by ${name}`}
              onPress={onReport}
              hitSlop={8}
              style={styles.replyButton}
            >
              <Text style={[textStyles.caption, styles.replyLabel]}>Report</Text>
            </Pressable>
          )}
        </View>
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
  onReport,
  viewerId,
  onSend,
  onPickImage,
  onTakePhoto,
  onInputFocusChange,
  autoFocusInput = false,
}: CommentSheetProps) {
  const [draft, setDraft] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [sending, setSending] = useState(false);
  // True while the system camera / photo picker is presented. The composer
  // dock lives in a FullWindowOverlay, which renders at the WINDOW level —
  // above ANY presented view controller, including the camera. Left mounted,
  // it paints over (and steals touches from) the camera's bottom controls
  // (Cancel / Retake / Use Photo), dead-ending the flow — so the overlay
  // unmounts for exactly the picker's lifetime.
  const [nativePickerOpen, setNativePickerOpen] = useState(false);
  // Height of the dock's CONTENT (reply bar + preview + composer) — measured
  // on an inner wrapper so the animated keyboard padding below it can't
  // retrigger onLayout every frame.
  const [dockContentHeight, setDockContentHeight] = useState(0);
  const [pending, setPending] = useState<PendingComment | null>(null);
  // Threads showing all replies (founder refinement 4 — default is first
  // reply + "View X more replies").
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const keyboardClearance = useKeyboardClearance();
  const { height: windowHeight } = useWindowDimensions();

  // Idle: flush above the home indicator. Keyboard up: the keyboard's whole
  // height becomes dock PADDING (not a translate), so the dock's surface
  // paints continuously from the input pill down behind the keyboard — no
  // seam can appear against the keyboard's top edge at any size or mid-
  // animation (founder polish fix 2). The padding is a Reanimated worklet
  // driven by useAnimatedKeyboard: it tracks the native keyboard frame
  // PER-FRAME ON THE UI THREAD, so the dock moves in true lockstep with
  // UIKit's own keyboard/sheet animation (the same animator as the
  // comment-button open) — no JS round-trip, no LayoutAnimation to race it.
  // Under system Reduce Motion the keyboard's native (reduced) transition
  // is still what drives every frame — we add no animation of our own.
  const idlePadBottom = Math.max(insets.bottom, spacing.xs);
  const keyboard = useAnimatedKeyboard();
  const dockPadStyle = useAnimatedStyle(() => ({
    // max() keeps the transition continuous where the rising keyboard
    // crosses the home-indicator inset (no branch pop).
    paddingBottom: Math.max(keyboard.height.value + spacing.xs, idlePadBottom),
  }));

  const topLevel = (comments ?? []).filter((c) => c.parent_comment_id === null);
  const repliesOf = (id: string) =>
    (comments ?? []).filter((c) => c.parent_comment_id === id);

  // Settle the pending row once the refetched thread includes the new
  // comment — a soft layout transition instead of a hard cut (skipped under
  // reduced motion; the swap still happens, just without animation).
  const commentCount = comments?.length ?? 0;
  useEffect(() => {
    if (pending && commentCount > pending.countAtSend) {
      if (!reducedMotion) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setPending(null);
    }
  }, [commentCount, pending, reducedMotion]);

  const expandThread = (threadId: string) => {
    if (!reducedMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpandedThreads((prev) => new Set(prev).add(threadId));
  };

  const startReply = (comment: CommentView) =>
    setReplyTo({
      threadId: comment.parent_comment_id ?? comment.id,
      name: comment.display_name || comment.username,
    });

  const attachImage = async (source: 'gallery' | 'camera') => {
    setNativePickerOpen(true);
    try {
      const uri = source === 'gallery' ? await onPickImage() : await onTakePhoto();
      if (uri) setImageUri(uri);
    } catch (e) {
      Alert.alert('Cannot attach photo', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setNativePickerOpen(false);
    }
  };

  const canSend = (draft.trim().length > 0 || imageUri !== null) && !sending;

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    const staged: PendingComment = {
      body: draft.trim(),
      imageUri,
      threadId: replyTo?.threadId,
      countAtSend: commentCount,
    };
    // The comment appears immediately as a dimmed "posting" row and settles
    // when the server thread catches up (founder refinement 3).
    if (!reducedMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setPending(staged);
    // A reply into a collapsed thread must be visible right away.
    if (staged.threadId) expandThread(staged.threadId);
    try {
      await onSend({
        body: staged.body,
        parentThreadId: staged.threadId,
        imageUri: staged.imageUri,
      });
      setDraft('');
      setImageUri(null);
      setReplyTo(null);
    } catch (e) {
      setPending(null);
      Alert.alert('Comment not posted', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSending(false);
    }
  };

  const pendingRow = (staged: PendingComment) => (
    <View style={[styles.row, staged.threadId ? styles.rowReply : null, styles.rowPending]}>
      <View style={[styles.avatar, staged.threadId ? styles.avatarSmall : null]}>
        <Text style={[textStyles.headerS, styles.avatarLetter]}>{myInitial}</Text>
      </View>
      <View style={styles.commentBlock}>
        <View style={styles.postingLine}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
          <Text style={[textStyles.caption, styles.name]}>Posting…</Text>
        </View>
        {staged.body.length > 0 && (
          <Text style={[textStyles.body, styles.body]}>{staged.body}</Text>
        )}
        {staged.imageUri && (
          <Image
            source={{ uri: staged.imageUri }}
            style={styles.commentImage}
            resizeMode="cover"
          />
        )}
      </View>
    </View>
  );

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
          // Keep the thread's tail clear of the floating dock. Composed from
          // the settled clearance values — never animated (see
          // useKeyboardClearance): a list-wide relayout mid-slide was the
          // stutter's other half.
          {
            paddingBottom:
              dockContentHeight +
              (keyboardClearance > 0
                ? keyboardClearance + spacing.xs
                : idlePadBottom) +
              spacing.sm,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        // Stage-1 collapse (founder refinement 2): while typing the sheet's
        // dismiss gesture is off, so a downward drag scrolls the list and
        // this drops ONLY the keyboard.
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[textStyles.headerS, styles.title]}>Comments</Text>
          </View>
        }
        stickyHeaderIndices={[0]}
        renderItem={({ item }) => {
          // Collapsed threads (founder refinement 4): first reply inline,
          // the rest behind "View X more replies".
          const replies = repliesOf(item.id);
          const expanded = expandedThreads.has(item.id);
          const visibleReplies = expanded ? replies : replies.slice(0, 1);
          const hiddenCount = replies.length - visibleReplies.length;
          return (
            <View style={styles.thread}>
              <CommentRow
                comment={item}
                isReply={false}
                onLike={() => onToggleLike(item)}
                onReply={() => startReply(item)}
                onReport={
                  onReport && item.user_id !== viewerId
                    ? () => onReport(item)
                    : undefined
                }
              />
              {visibleReplies.map((reply) => (
                <CommentRow
                  key={reply.id}
                  comment={reply}
                  isReply
                  onLike={() => onToggleLike(reply)}
                  onReply={() => startReply(reply)}
                  onReport={
                    onReport && reply.user_id !== viewerId
                      ? () => onReport(reply)
                      : undefined
                  }
                />
              ))}
              {hiddenCount > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`View ${hiddenCount} more replies`}
                  onPress={() => expandThread(item.id)}
                  style={styles.moreReplies}
                >
                  <View style={styles.moreRepliesRule} />
                  <Text style={[textStyles.caption, styles.moreRepliesLabel]}>
                    View {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
                  </Text>
                </Pressable>
              )}
              {pending?.threadId === item.id && pendingRow(pending)}
            </View>
          );
        }}
        ListFooterComponent={
          pending && !pending.threadId ? pendingRow(pending) : null
        }
        ListEmptyComponent={
          // While the first-ever comment is posting, the pending footer row
          // is the content — don't show "No comments yet" under it.
          pending ? null : (
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
          )
        }
      />

      {/* Composer dock — window-bottom pinned (see LAYOUT CONTRACT).
          Unmounted while a native picker is up (see nativePickerOpen). */}
      {!nativePickerOpen && (
      <FullWindowOverlay>
        <View style={styles.overlayRoot} pointerEvents="box-none">
          <Animated.View style={[styles.dock, dockPadStyle]}>
            <View
              onLayout={(e) => setDockContentHeight(e.nativeEvent.layout.height)}
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
                  onFocus={() => onInputFocusChange?.(true)}
                  onBlur={() => onInputFocusChange?.(false)}
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
          </Animated.View>
        </View>
      </FullWindowOverlay>
      )}
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
  rowPending: {
    opacity: 0.55,
    marginTop: spacing.xs,
  },
  postingLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  moreReplies: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.xl,
    marginTop: spacing.xxs,
  },
  moreRepliesRule: {
    width: 28,
    height: 1,
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  moreRepliesLabel: {
    color: colors.textSecondary,
    fontWeight: '700',
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
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
