import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressButton } from '@/components/ui/PressButton';
import { colors, spacing, textStyles } from '@/theme';

import { ONBOARDING_STEPS, stepIndex, type OnboardingStep } from './steps';

interface OnboardingScreenProps {
  step: OnboardingStep;
  title: string;
  children: ReactNode;
  ctaLabel: string;
  onCta: () => void;
  ctaDisabled?: boolean;
  /** Rendered under the CTA when the step is skippable. */
  onSkip?: () => void;
  skipLabel?: string;
}

/** Shared scaffold: progress dots, hero title, content, CTA (+ optional skip). */
export function OnboardingScreen({
  step,
  title,
  children,
  ctaLabel,
  onCta,
  ctaDisabled,
  onSkip,
  skipLabel = 'Skip for now',
}: OnboardingScreenProps) {
  const current = stepIndex(step);

  return (
    <View style={styles.container}>
      <View style={styles.dots} accessibilityLabel={`Step ${current + 1} of ${ONBOARDING_STEPS.length}`}>
        {ONBOARDING_STEPS.map((s, i) => (
          <View
            key={s}
            style={[styles.dot, i === current && styles.dotActive]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[textStyles.hero, styles.title]}>{title}</Text>
        {children}
      </ScrollView>

      <View style={styles.footer}>
        <PressButton label={ctaLabel} onPress={onCta} disabled={ctaDisabled} />
        {onSkip ? (
          <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skip}>
            <Text style={[textStyles.bodyEmphasis, styles.skipText]}>{skipLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceSecondary,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  content: {
    flexGrow: 1,
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  footer: {
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  skip: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    color: colors.info,
  },
});
