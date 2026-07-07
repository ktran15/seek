import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
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
import { useAddComment, useComments, type Comment } from '@/features/feed/useFeed';
import { useProfilesById } from '@/features/friends/useFriends';
import { colors, radii, spacing, textStyles } from '@/theme';

const MAX_COMMENT_LENGTH = 500;

function CommentRow({ comment, name }: { comment: Comment; name: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={[textStyles.headerS, styles.avatarLetter]}>
          {(name || '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.commentBlock}>
        <Text style={[textStyles.bodyEmphasis, styles.name]}>{name}</Text>
        <Text style={[textStyles.body, styles.body]}>{comment.body}</Text>
      </View>
    </View>
  );
}

/** Comments on one feed post (spec §11): read + add; no edits/deletes in v1. */
export default function CommentsScreen() {
  const { postId, name: posterName } = useLocalSearchParams<{
    postId: string;
    name?: string;
  }>();
  const { session } = useSession();
  const userId = session?.user.id;
  const [draft, setDraft] = useState('');

  const { data: comments, isLoading, error } = useComments(postId);
  const addComment = useAddComment(userId);

  const commenterIds = [...new Set((comments ?? []).map((c) => c.user_id))];
  const { data: profiles } = useProfilesById(commenterIds);
  const nameOf = (id: string): string => {
    const p = profiles?.find((profile) => profile.id === id);
    return p?.display_name || p?.username || '…';
  };

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    addComment.mutate(
      { postId, body },
      {
        onSuccess: () => setDraft(''),
        onError: (e) =>
          Alert.alert(
            'Comment not posted',
            e instanceof Error ? e.message : 'Try again.',
          ),
      },
    );
  };

  return (
    <ErrorBoundary screen="Comments">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <FlatList
          data={comments ?? []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <CommentRow comment={item} name={nameOf(item.user_id)} />
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

        <View style={styles.composer}>
          <TextInput
            style={[textStyles.body, styles.input]}
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a comment…"
            placeholderTextColor={colors.textSecondary}
            maxLength={MAX_COMMENT_LENGTH}
            multiline
            accessibilityLabel="Comment text"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Post comment"
            disabled={!draft.trim() || addComment.isPending}
            onPress={send}
            style={[styles.send, (!draft.trim() || addComment.isPending) && styles.sendDisabled]}
          >
            <Text style={[textStyles.headerS, styles.sendLabel]}>POST</Text>
          </Pressable>
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
  list: {
    padding: spacing.md,
    gap: spacing.sm,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.textPrimary,
  },
  commentBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.textPrimary,
  },
  body: {
    color: colors.textPrimary,
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
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  send: {
    minHeight: 44,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
  },
  sendDisabled: {
    opacity: 0.5,
  },
  sendLabel: {
    color: colors.textOnPrimary,
    fontSize: 14,
  },
});
