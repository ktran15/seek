import { Image, StyleSheet, Text, View } from 'react-native';

import { getAssetOrNull } from '@/assets/registry';
import type { AvatarConfig } from '@/lib/database.types';
import { colors, radii, spacing, textStyles } from '@/theme';

import {
  beaverBodyColor,
  beaverBodySlotName,
  beaverSex,
  bodyColorOption,
  sexLabel,
} from './catalog';

/**
 * Renders the player beaver at its chosen body (sex × color, spec §10.1).
 *
 * When the real body art has landed in the `beaverBody{Sex}{Color}` registry
 * slot it renders that image directly. Until then — the beaver art is
 * founder-supplied later — it draws a clean placeholder: a fur-colored disc
 * with a beaver glyph and a caption, so onboarding's "Customize your beaver"
 * is fully usable now and the live preview still reacts to every selection.
 * (Cosmetics are earned from crates, never at onboarding — start plain, §18 —
 * so this component takes no cosmetics.)
 */
export function BeaverPreview({
  config,
  height = 200,
}: {
  config: AvatarConfig | undefined;
  height?: number;
}) {
  const sex = beaverSex(config);
  const color = beaverBodyColor(config);
  const option = bodyColorOption(color);
  const label = `${sexLabel(sex)} · ${option.label} beaver`;

  const art = getAssetOrNull(beaverBodySlotName(config));
  if (art) {
    return (
      <Image
        source={art}
        style={{ width: height, height, alignSelf: 'center' }}
        resizeMode="contain"
        accessibilityLabel={label}
      />
    );
  }

  // Placeholder path (no real art yet).
  const disc = Math.round(height * 0.72);
  return (
    <View style={styles.wrap} accessibilityLabel={`${label} (placeholder)`}>
      <View
        style={[
          styles.disc,
          {
            width: disc,
            height: disc,
            borderRadius: disc / 2,
            backgroundColor: option.swatch,
          },
        ]}
      >
        <Text style={{ fontSize: Math.round(disc * 0.46) }}>🦫</Text>
        {sex === 'female' ? (
          // Distinct-design placeholder cue — female body is its own design,
          // not a recolor (§10.1); the real art carries the difference.
          <Text
            style={[styles.femaleCue, { fontSize: Math.round(disc * 0.2) }]}
          >
            🎀
          </Text>
        ) : null}
      </View>
      <Text style={[textStyles.caption, styles.caption]}>
        Placeholder — {option.label.toLowerCase()} beaver art coming soon
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xs },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.shadow,
    borderRadius: radii.card,
  },
  femaleCue: { position: 'absolute', top: '6%' },
  caption: { color: colors.textSecondary, textAlign: 'center' },
});
