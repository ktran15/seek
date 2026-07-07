import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';

import { colors, durations, easings, radii, spacing, textStyles } from '@/theme';

import type { FeedMedia } from './useFeed';

const MEDIA_HEIGHT = 320;
const AUTO_ADVANCE_MS = 3000;

function mediaKind(path: string): 'image' | 'video' {
  return /\.(mp4|mov)$/i.test(path) ? 'video' : 'image';
}

function VideoProof({ url }: { url: string }) {
  const player = useVideoPlayer(url);
  return (
    <VideoView player={player} style={styles.media} contentFit="cover" nativeControls />
  );
}

/** Fullscreen swipe/select gallery — tap-to-open from the carousel (spec §11). */
function GalleryModal({
  media,
  initialIndex,
  onClose,
}: {
  media: FeedMedia[];
  initialIndex: number;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.galleryBackdrop}>
        <FlatList
          data={media}
          keyExtractor={(m) => m.path}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_data, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) =>
            setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item }) => (
            <View style={{ width, height }}>
              {item.url ? (
                <Image
                  source={{ uri: item.url }}
                  style={styles.galleryImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.galleryMissing}>
                  <Text style={[textStyles.caption, styles.galleryCounterText]}>
                    Photo unavailable
                  </Text>
                </View>
              )}
            </View>
          )}
        />
        <View style={styles.galleryCounter} pointerEvents="none">
          <Text style={[textStyles.bodyEmphasis, styles.galleryCounterText]}>
            {index + 1} / {media.length}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close gallery"
          onPress={onClose}
          style={styles.galleryClose}
          hitSlop={12}
        >
          <Text style={[textStyles.headerS, styles.galleryCounterText]}>✕</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

/**
 * Post media (spec §11): single photo/video renders plain; multi-photo (day 5)
 * renders an auto-advancing, swipeable carousel — tap opens the fullscreen
 * gallery. Auto-advance stops on first touch and under reduced motion.
 * Double-tap likes (M6.1) on photos; videos keep their native controls.
 */
export function MediaCarousel({
  media,
  onDoubleTap,
}: {
  media: FeedMedia[];
  onDoubleTap?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const listRef = useRef<FlatList<FeedMedia>>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [touched, setTouched] = useState(false);
  const [galleryAt, setGalleryAt] = useState<number | null>(null);

  // Heart pop on double-tap (IG-style). Calm variant under reduced motion:
  // fade only, no scale burst (aesthetic §8).
  const heartOpacity = useSharedValue(0);
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({
    opacity: heartOpacity.value,
    transform: [{ scale: heartScale.value }],
  }));

  const handleDoubleTap = () => {
    if (!onDoubleTap) return;
    onDoubleTap();
    heartOpacity.value = withSequence(
      withTiming(1, { duration: durations.press }),
      withDelay(400, withTiming(0, { duration: durations.base })),
    );
    if (!reducedMotion) {
      heartScale.value = 0.6;
      heartScale.value = withTiming(1.1, {
        duration: durations.base,
        easing: Easing.bezier(...easings.bounce),
      });
    }
  };

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(250)
    .onEnd((_event, success) => {
      if (success) runOnJS(handleDoubleTap)();
    });

  const heartOverlay = (
    <Animated.View pointerEvents="none" style={[styles.heartOverlay, heartStyle]}>
      <Ionicons name="heart" size={96} color={colors.textOnDark} />
    </Animated.View>
  );

  const autoAdvance =
    media.length > 1 && !touched && !reducedMotion && galleryAt === null;

  useEffect(() => {
    if (!autoAdvance || pageWidth === 0) return;
    const interval = setInterval(() => {
      setPage((current) => {
        const next = (current + 1) % media.length;
        listRef.current?.scrollToOffset({ offset: next * pageWidth, animated: true });
        return next;
      });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, [autoAdvance, pageWidth, media.length]);

  if (media.length === 0) {
    return (
      <View style={[styles.media, styles.mediaEmpty]}>
        <Text style={[textStyles.caption, styles.mutedText]}>Loading proof…</Text>
      </View>
    );
  }

  const first = media[0] as FeedMedia;
  if (media.length === 1) {
    if (!first.url) {
      return (
        <View style={[styles.media, styles.mediaEmpty]}>
          <Text style={[textStyles.caption, styles.mutedText]}>Proof unavailable</Text>
        </View>
      );
    }
    // Videos keep native controls — a tap gesture on top would fight them.
    if (mediaKind(first.path) === 'video') {
      return <VideoProof url={first.url} />;
    }
    return (
      <GestureDetector gesture={doubleTap}>
        <View>
          <Image source={{ uri: first.url }} style={styles.media} resizeMode="cover" />
          {heartOverlay}
        </View>
      </GestureDetector>
    );
  }

  return (
    <View onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}>
      <FlatList
        ref={listRef}
        data={media}
        keyExtractor={(m) => m.path}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onTouchStart={() => setTouched(true)}
        onMomentumScrollEnd={(e) => {
          if (pageWidth > 0) {
            setPage(Math.round(e.nativeEvent.contentOffset.x / pageWidth));
          }
        }}
        renderItem={({ item, index }) => {
          // Single tap opens the gallery only after the double-tap (like)
          // window has passed, so a double-tap never opens the gallery.
          const openTap = Gesture.Tap()
            .requireExternalGestureToFail(doubleTap)
            .onEnd((_event, success) => {
              if (success) runOnJS(setGalleryAt)(index);
            });
          return (
            <GestureDetector gesture={Gesture.Exclusive(doubleTap, openTap)}>
              <View
                accessible
                accessibilityRole="imagebutton"
                accessibilityLabel={`Open photo ${index + 1} of ${media.length}`}
                style={{ width: pageWidth || 1 }}
              >
                {item.url ? (
                  <Image
                    source={{ uri: item.url }}
                    style={styles.media}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.media, styles.mediaEmpty]}>
                    <Text style={[textStyles.caption, styles.mutedText]}>
                      Photo unavailable
                    </Text>
                  </View>
                )}
              </View>
            </GestureDetector>
          );
        }}
      />
      {heartOverlay}
      <View style={styles.dots} pointerEvents="none">
        {media.map((m, i) => (
          <View key={m.path} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>
      {galleryAt !== null && (
        <GalleryModal
          media={media}
          initialIndex={galleryAt}
          onClose={() => setGalleryAt(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  media: {
    height: MEDIA_HEIGHT,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceNature,
    width: '100%',
  },
  mediaEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedText: {
    color: colors.textSecondary,
  },
  heartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: MEDIA_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceSecondary,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  galleryBackdrop: {
    flex: 1,
    backgroundColor: colors.shadow,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryMissing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryCounter: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
    backgroundColor: colors.scrim,
  },
  galleryCounterText: {
    color: colors.textOnDark,
  },
  galleryClose: {
    position: 'absolute',
    top: 56,
    right: spacing.md,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.scrim,
  },
});
