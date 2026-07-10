import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, textStyles } from '@/theme';

import { FriendSuggestions } from './FriendSuggestions';
import { PostCard } from './PostCard';
import { useFeed, type FeedPost, type FeedScope } from './useFeed';

/** Suggestions slot in the list after this many posts (or at the end). */
const SUGGESTIONS_AFTER = 2;

type FeedItem = { kind: 'post'; post: FeedPost } | { kind: 'suggestions' };

const EMPTY_COPY: Record<FeedScope, { title: string; copy?: string }> = {
  friends: {
    title: 'Nothing here yet',
    copy: 'Complete today’s challenge — your proof posts here. Add friends to fill this feed with theirs.',
  },
  fof: {
    title: 'No friends-of-friends yet',
  },
  explore: {
    title: 'No posts today yet',
    copy: 'Everyone’s proof from today’s challenge lands here. Be the first!',
  },
};

/**
 * One Home feed (spec §5): posts via the feed Edge Function, with friend
 * suggestions woven in (friends/FoF scopes — Explore stays pure posts).
 */
export function Feed({ scope }: { scope: FeedScope }) {
  const { data: posts, isLoading, error, refetch, isRefetching } = useFeed(scope);

  const withSuggestions = scope !== 'explore';
  const items: FeedItem[] = (posts ?? []).map((post) => ({ kind: 'post', post }));
  if (withSuggestions && items.length > 0) {
    items.splice(Math.min(SUGGESTIONS_AFTER, items.length), 0, { kind: 'suggestions' });
  }

  const empty = EMPTY_COPY[scope];

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => (item.kind === 'post' ? item.post.post_id : 'suggestions')}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={colors.textSecondary}
        />
      }
      renderItem={({ item }) =>
        item.kind === 'post' ? <PostCard post={item.post} /> : <FriendSuggestions />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={[textStyles.headerL, styles.emptyTitle]}>
            {isLoading ? 'Loading…' : error ? 'Could not load the feed' : empty.title}
          </Text>
          {!isLoading && (error || empty.copy) && (
            <Text style={[textStyles.body, styles.emptyCopy]}>
              {error ? 'Pull to retry.' : empty.copy}
            </Text>
          )}
          {!isLoading && withSuggestions && <FriendSuggestions />}
        </View>
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
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyCopy: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
