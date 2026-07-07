import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/auth/useSession';
import { useProfile } from '@/features/profile/useProfile';
import { colors, spacing, textStyles } from '@/theme';

import { PostCard } from './PostCard';
import { useMyPosts } from './useMyPosts';

/**
 * Friends feed, early slice: the user's OWN submitted posts (M4 review ask).
 * Friends' posts, likes, comments, and suggestions land with the full feed
 * in M6 — same card component, wider query.
 */
export function FriendsFeed() {
  const { session } = useSession();
  const userId = session?.user.id;
  const { data: profile } = useProfile(userId);
  const { posts, isLoading } = useMyPosts(userId);

  return (
    <FlatList
      data={posts}
      keyExtractor={(post) => post.submission.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          displayName={profile?.display_name ?? ''}
          username={profile?.username ?? ''}
        />
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={[textStyles.headerL, styles.emptyTitle]}>
            {isLoading ? 'Loading…' : 'Nothing here yet'}
          </Text>
          {!isLoading && (
            <Text style={[textStyles.body, styles.emptyCopy]}>
              Complete today’s challenge and your proof posts here for your
              friends to see.
            </Text>
          )}
        </View>
      }
      ListFooterComponent={
        posts.length > 0 ? (
          <Text style={[textStyles.caption, styles.note]}>
            Your friends’ posts appear here in M6.
          </Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
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
  note: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
