import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressButton } from '@/components/ui/PressButton';
import { config } from '@/config';
import { colors, radii, spacing, textStyles } from '@/theme';

export interface MultiPhotoResult {
  uris: string[];
  count: number;
}

/**
 * Day 5 capture (spec §7.1): up to `multiPhotoMax` (TUNE 25) selfie photos;
 * score = photo count. Photos = public proof.
 */
export function MultiPhotoCapture({
  onCaptured,
  onCancel,
}: {
  onCaptured: (result: MultiPhotoResult) => void;
  onCancel: () => void;
}) {
  const max = config.media.multiPhotoMax;
  const [uris, setUris] = useState<string[]>([]);

  const addFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: max - uris.length,
      quality: 0.7,
    });
    if (result.assets?.length) {
      const incoming = result.assets.map((a) => a.uri);
      setUris((prev) => [...new Set([...prev, ...incoming])].slice(0, max));
    }
  };

  const takeOne = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    const asset = result.assets?.[0];
    if (asset?.uri) {
      setUris((prev) => [...new Set([...prev, asset.uri])].slice(0, max));
    }
  };

  const remove = (uri: string) => setUris((prev) => prev.filter((u) => u !== uri));

  return (
    <View style={styles.container}>
      <Text style={[textStyles.headerL, styles.title]}>
        Selfie count: {uris.length}
        <Text style={styles.max}> / {max}</Text>
      </Text>
      <Text style={[textStyles.caption, styles.hint]}>
        One selfie per different person. Your count is your score — higher
        wins; ties go to the earlier submission.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.thumbRow}>
          {uris.map((uri) => (
            <Pressable
              key={uri}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              onLongPress={() => remove(uri)}
              style={styles.thumbWrap}
            >
              <Image source={{ uri }} style={styles.thumb} />
            </Pressable>
          ))}
          {uris.length === 0 && (
            <View style={styles.emptyThumb}>
              <Text style={[textStyles.caption, styles.hint]}>
                No selfies yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      {uris.length > 0 && (
        <Text style={[textStyles.caption, styles.hint]}>
          Long-press a photo to remove it.
        </Text>
      )}

      <PressButton
        label="TAKE A SELFIE"
        onPress={takeOne}
        disabled={uris.length >= max}
      />
      <PressButton
        label="ADD FROM LIBRARY"
        variant="info"
        onPress={addFromLibrary}
        disabled={uris.length >= max}
      />
      <PressButton
        label={`SUBMIT ${uris.length} SELFIE${uris.length === 1 ? '' : 'S'}`}
        disabled={uris.length === 0}
        onPress={() => onCaptured({ uris, count: uris.length })}
      />
      <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancel}>
        <Text style={[textStyles.bodyEmphasis, styles.cancelText]}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
  },
  max: {
    color: colors.textSecondary,
  },
  hint: {
    color: colors.textSecondary,
  },
  thumbRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  thumbWrap: {
    borderRadius: radii.sm,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  emptyThumb: {
    width: 84,
    height: 84,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.info,
  },
});
