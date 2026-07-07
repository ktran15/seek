import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { getAsset } from '@/assets/registry';
import { PressButton } from '@/components/ui/PressButton';
import { config } from '@/config';
import { colors, radii, spacing, textStyles } from '@/theme';

type Stage = 'success' | 'coins' | 'crate' | 'climb' | 'feed';

const ORDER: Stage[] = ['success', 'coins', 'crate', 'climb', 'feed'];

interface PostSubmitSequenceProps {
  day: number;
  onDone: () => void;
}

/**
 * Post-submit sequence (spec §1.3, LOCKED order):
 * success → coins → crate-to-inventory → climb → posted-to-feed.
 * M4 renders the staged screens; expressive animation is the M13 pass.
 * Coin/crate amounts shown from config — actual ledger/crate awards are
 * wired server-side in M7 (visible stub), feed post lands in M6.
 */
export function PostSubmitSequence({ day, onDone }: PostSubmitSequenceProps) {
  const [index, setIndex] = useState(0);
  const stage = ORDER[index] as Stage;
  const last = index === ORDER.length - 1;

  return (
    <View style={styles.container}>
      {stage === 'success' && (
        <>
          <Text style={[textStyles.heroXL, styles.celebrate]}>NAILED IT</Text>
          <Text style={[textStyles.body, styles.copy]}>
            Day {day} — done. One attempt, one submission, all proof.
          </Text>
        </>
      )}

      {stage === 'coins' && (
        <>
          <Text style={[textStyles.heroXL, styles.coins]}>
            +{config.economy.coins.challengeCompletion}
          </Text>
          <Text style={[textStyles.headerL, styles.title]}>coins earned</Text>
          <Text style={[textStyles.caption, styles.copy]}>
            (Coin balance goes live with the shop economy in M7.)
          </Text>
        </>
      )}

      {stage === 'crate' && (
        <>
          <Image source={getAsset('crateWooden')} style={styles.crate} />
          <Text style={[textStyles.headerL, styles.title]}>
            Wooden crate added to your inventory
          </Text>
          <Text style={[textStyles.caption, styles.copy]}>
            Open it from Profile → Inventory. (Crate opening lands in M7.)
          </Text>
        </>
      )}

      {stage === 'climb' && (
        <>
          <View style={styles.climbRow}>
            <Image source={getAsset('hikerBase')} style={styles.hiker} />
            <Image source={getAsset('flagPlanted')} style={styles.flag} />
          </View>
          <Text style={[textStyles.headerL, styles.title]}>
            Stop {day} of {config.beta.lengthDays} — flag planted
          </Text>
          <Text style={[textStyles.body, styles.copy]}>
            {day === config.beta.lengthDays
              ? 'That’s the summit. Unreal.'
              : 'One stop closer to the summit.'}
          </Text>
        </>
      )}

      {stage === 'feed' && (
        <>
          <Text style={[textStyles.headerL, styles.title]}>
            Posted to your friends’ feed
          </Text>
          <Text style={[textStyles.body, styles.copy]}>
            Your proof is public to your circle — likes, comments, and bragging
            rights start now. (Feed goes live in M6.)
          </Text>
        </>
      )}

      <PressButton
        label={last ? 'BACK TO THE MOUNTAIN' : 'NEXT'}
        onPress={() => (last ? onDone() : setIndex(index + 1))}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  celebrate: {
    color: colors.primary,
  },
  coins: {
    color: colors.celebration,
  },
  title: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  copy: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  crate: {
    width: 120,
    height: 120,
    borderRadius: radii.card,
  },
  climbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hiker: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  flag: {
    width: 48,
    height: 48,
  },
  button: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
});
