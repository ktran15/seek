import { useVideoPlayer, VideoView } from 'expo-video';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, elevation, radii, spacing, textStyles } from '@/theme';

import type { MyPost, ProofMedia } from './useMyPosts';

const MEDIA_HEIGHT = 320;

function VideoProof({ url }: { url: string }) {
  const player = useVideoPlayer(url);
  return (
    <VideoView
      player={player}
      style={styles.media}
      contentFit="cover"
      nativeControls
    />
  );
}

function MediaBlock({ media }: { media: ProofMedia[] }) {
  if (media.length === 0) {
    return (
      <View style={[styles.media, styles.mediaEmpty]}>
        <Text style={[textStyles.caption, styles.muted]}>Loading proof…</Text>
      </View>
    );
  }
  const first = media[0] as ProofMedia;
  if (media.length === 1) {
    return first.kind === 'video' ? (
      <VideoProof url={first.url} />
    ) : (
      <Image source={{ uri: first.url }} style={styles.media} resizeMode="cover" />
    );
  }
  // Multi-photo (day 5): simple swipeable strip — full carousel/gallery is M6.
  return (
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
      {media.map((m) => (
        <Image
          key={m.path}
          source={{ uri: m.url }}
          style={[styles.media, styles.mediaPage]}
          resizeMode="cover"
        />
      ))}
    </ScrollView>
  );
}

/** A submitted proof rendered as a feed post (own posts today; friends' in M6). */
export function PostCard({
  post,
  displayName,
  username,
}: {
  post: MyPost;
  displayName: string;
  username: string;
}) {
  const { submission, challenge, media } = post;

  return (
    <View style={[styles.card, elevation.card]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={[textStyles.headerS, styles.avatarInitial]}>
            {(displayName || username || '?').slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={[textStyles.bodyEmphasis, styles.name]} numberOfLines={1}>
            {displayName || username}
          </Text>
          <Text style={[textStyles.caption, styles.muted]} numberOfLines={1}>
            Day {submission.beta_day}
            {challenge ? ` · ${challenge.title}` : ''}
          </Text>
        </View>
      </View>

      <MediaBlock media={media} />

      <Text style={[textStyles.caption, styles.muted]}>
        {media.length > 1 ? `${media.length} photos · ` : ''}
        Likes & comments arrive with the full feed (M6).
      </Text>
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
  media: {
    height: MEDIA_HEIGHT,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceNature,
    width: '100%',
  },
  mediaPage: {
    width: 280,
    marginRight: spacing.xs,
  },
  mediaEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
