import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useCastVote, useVoteFeed, type VotePost } from '@/features/vote/useVoteFeed';
import { colors, elevation, radii, spacing, textStyles } from '@/theme';

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function VoteCard({
  post,
  isMyVote,
  votingOpen,
  onVote,
}: {
  post: VotePost;
  isMyVote: boolean;
  votingOpen: boolean;
  onVote: () => void;
}) {
  return (
    <View style={[styles.card, elevation.card, isMyVote && styles.cardVoted]}>
      <Text style={[textStyles.bodyEmphasis, styles.name]}>
        {post.display_name || post.username}
      </Text>
      {post.media_url ? (
        <Image source={{ uri: post.media_url }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.photoEmpty]}>
          <Text style={[textStyles.caption, styles.muted]}>Photo unavailable</Text>
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isMyVote ? 'Your vote' : `Vote for ${post.username}`}
        disabled={!votingOpen}
        onPress={onVote}
        style={[
          styles.voteButton,
          isMyVote && styles.voteButtonActive,
          !votingOpen && styles.voteButtonClosed,
        ]}
      >
        <Text
          style={[
            textStyles.headerS,
            isMyVote ? styles.voteLabelActive : styles.voteLabel,
          ]}
        >
          {isMyVote ? '✓ YOUR VOTE' : votingOpen ? 'VOTE' : 'CLOSED'}
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * Day-3 community vote (spec §7.7): friends' posts, ONE changeable vote,
 * global EST close. Tally + results arrive via day-close → notifications.
 */
export default function VoteScreen() {
  const { data, isLoading, error } = useVoteFeed(true);
  const castVote = useCastVote();
  const [now, setNow] = useState(() => Date.now());

  const open = data?.window.open ?? false;

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [open]);

  const onVote = (post: VotePost) => {
    castVote.mutate(post.submission_id, {
      onError: (e) =>
        Alert.alert('Vote not counted', e instanceof Error ? e.message : 'Try again.'),
    });
  };

  return (
    <ErrorBoundary screen="Community Vote">
      <View style={styles.container}>
        {data && (
          <View style={styles.windowBar}>
            <Text style={[textStyles.caption, styles.windowText]}>
              {open
                ? 'Voting closes for everyone at the same time (EST)'
                : 'Voting is closed — results land in your notifications'}
            </Text>
            {open && (
              <Text style={[textStyles.timerS, styles.windowClock]}>
                {formatRemaining(Date.parse(data.window.closes_at) - now)}
              </Text>
            )}
          </View>
        )}

        <FlatList
          data={data?.posts ?? []}
          keyExtractor={(post) => post.submission_id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <VoteCard
              post={item}
              isMyVote={data?.my_vote === item.submission_id}
              votingOpen={open}
              onVote={() => onVote(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[textStyles.headerL, styles.emptyTitle]}>
                {isLoading ? 'Loading…' : error ? 'Could not load votes' : 'No posts to vote on'}
              </Text>
              {!isLoading && !error && (
                <Text style={[textStyles.body, styles.muted]}>
                  When your friends submit today’s challenge, their posts show
                  up here for your vote.
                </Text>
              )}
            </View>
          }
          ListFooterComponent={
            (data?.posts.length ?? 0) > 0 ? (
              <Text style={[textStyles.caption, styles.footerNote]}>
                One vote — change it as often as you like until the clock hits
                zero.
              </Text>
            ) : null
          }
        />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  windowBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.info,
  },
  windowText: {
    flex: 1,
    color: colors.textOnDark,
  },
  windowClock: {
    color: colors.textOnDark,
  },
  list: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardVoted: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  name: {
    color: colors.textPrimary,
  },
  photo: {
    height: 280,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceNature,
  },
  photoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteButton: {
    minHeight: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  voteButtonActive: {
    backgroundColor: colors.primary,
  },
  voteButtonClosed: {
    opacity: 0.5,
  },
  voteLabel: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  voteLabelActive: {
    color: colors.textOnPrimary,
    fontSize: 14,
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
  muted: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footerNote: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
