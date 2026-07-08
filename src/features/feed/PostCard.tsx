import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { config } from '@/config';
import { useSession } from '@/features/auth/useSession';
import { betaDayInTimezone } from '@/lib/globalClock';
import { colors, elevation, radii, spacing, textStyles } from '@/theme';

import { MediaCarousel } from './MediaCarousel';
import {
  REPORT_REASONS,
  useBlockUser,
  useReport,
  useToggleLike,
  type FeedPost,
} from './useFeed';

function scoreCaption(post: FeedPost): string | null {
  switch (post.challenge.capture_type) {
    case 'timer_video':
      return post.score !== null ? `${post.score}s` : null;
    case 'screenshot_plus_count':
      return post.score !== null ? `${post.score} guesses` : null;
    case 'multi_photo_count':
      return `${post.media.length} photo${post.media.length === 1 ? '' : 's'}`;
    case 'camera_video':
      return post.difficulty === 'hard' && post.score !== null
        ? `${post.score} made`
        : null;
    default:
      return null;
  }
}

/** A submitted proof as a full feed post (spec §5, §11): like, comment,
 *  overflow report/block, day-5 carousel/gallery, day-3 vote chip. */
export function PostCard({ post }: { post: FeedPost }) {
  const router = useRouter();
  const { session } = useSession();
  const userId = session?.user.id;
  const toggleLike = useToggleLike(userId);
  const report = useReport(userId);
  const blockUser = useBlockUser(userId);

  const name = post.author.display_name || post.author.username;
  // Vote chip (spec §5): day-3 CV posts carry a Vote entry while the global
  // EST window is open. Own post can't be voted for (spec §7.7).
  const voteOpen =
    post.challenge.mode === 'CV' &&
    !post.is_own &&
    betaDayInTimezone(config.beta.startDate, config.beta.timezone) === 3;

  const onReport = () => {
    Alert.alert('Report post', 'Why are you reporting this post?', [
      ...REPORT_REASONS.map(({ label, reason }) => ({
        text: label,
        onPress: () =>
          report.mutate(
            { reason, postId: post.post_id },
            {
              onSuccess: () =>
                Alert.alert('Thanks', 'Your report is in — we review every one.'),
              onError: () => Alert.alert('Report failed', 'Please try again.'),
            },
          ),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const onBlock = () => {
    Alert.alert(
      `Block ${name}?`,
      'They disappear from your feeds, suggestions, matchups, and votes — and you from theirs.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () =>
            blockUser.mutate(post.author.id, {
              onError: () => Alert.alert('Block failed', 'Please try again.'),
            }),
        },
      ],
    );
  };

  const onOverflow = () => {
    Alert.alert(name, undefined, [
      { text: 'Report post', onPress: onReport },
      { text: 'Block user', style: 'destructive', onPress: onBlock },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const caption = scoreCaption(post);

  return (
    <View style={[styles.card, elevation.card]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={[textStyles.headerS, styles.avatarInitial]}>
            {(name || '?').slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={[textStyles.bodyEmphasis, styles.name]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[textStyles.caption, styles.muted]} numberOfLines={1}>
            Day {post.beta_day} · {post.challenge.title}
            {caption ? ` · ${caption}` : ''}
          </Text>
        </View>
        {!post.is_own && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Post options"
            onPress={onOverflow}
            hitSlop={8}
            style={styles.overflow}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Double-tap likes (never unlikes — IG behavior); the heart button
          below is the reversible toggle. */}
      <MediaCarousel
        media={post.media}
        onDoubleTap={() => {
          if (!post.viewer_liked) {
            toggleLike.mutate({ postId: post.post_id, liked: false });
          }
        }}
      />

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={post.viewer_liked ? 'Unlike' : 'Like'}
          accessibilityState={{ selected: post.viewer_liked }}
          onPress={() =>
            toggleLike.mutate({ postId: post.post_id, liked: post.viewer_liked })
          }
          style={styles.action}
          hitSlop={8}
        >
          <Ionicons
            name={post.viewer_liked ? 'heart' : 'heart-outline'}
            size={24}
            color={post.viewer_liked ? colors.primary : colors.textPrimary}
          />
          <Text style={[textStyles.bodyEmphasis, styles.actionCount]}>
            {post.like_count}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Comments, ${post.comment_count}`}
          onPress={() =>
            router.push({
              pathname: '/comments/[postId]',
              params: { postId: post.post_id, name },
            })
          }
          style={styles.action}
          hitSlop={8}
        >
          <Ionicons name="chatbubble-outline" size={22} color={colors.textPrimary} />
          <Text style={[textStyles.bodyEmphasis, styles.actionCount]}>
            {post.comment_count}
          </Text>
        </Pressable>

        {voteOpen && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Vote for ${name}`}
            onPress={() => router.push('/vote')}
            style={styles.voteChip}
          >
            <Text style={[textStyles.headerS, styles.voteChipLabel]}>VOTE</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.textPrimary,
  },
  nameBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.textPrimary,
  },
  muted: {
    color: colors.textSecondary,
  },
  overflow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: 44,
  },
  actionCount: {
    color: colors.textPrimary,
  },
  voteChip: {
    marginLeft: 'auto',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.info,
  },
  voteChipLabel: {
    color: colors.textOnDark,
    fontSize: 14,
  },
});
