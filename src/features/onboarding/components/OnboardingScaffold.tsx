import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type AssetSlot } from '@/assets/registry';

import { type OnboardingStep } from '../steps';
import { obColors, obText, sc } from '../theme';
import { HeroImage } from './HeroImage';
import { OnboardingButton } from './OnboardingButton';
import { ProgressDots } from './ProgressDots';
import { TextLink } from './TextLink';

interface OnboardingScaffoldProps {
  step: OnboardingStep;
  /** Full-bleed hero image slot at the very top (bleeds under the status bar). */
  hero?: AssetSlot;
  /** Hero banner aspect (width ÷ height) — see {@link HeroImage}. Default 1.5. */
  heroAspect?: number;
  /** Hero vertical crop focus 0…1 — see {@link HeroImage}. Default 0.5. */
  heroFocusY?: number;
  title: string;
  /** One of `obText.title*` — the prototype uses a different size per screen. */
  titleStyle: StyleProp<TextStyle>;
  subtitle?: string;
  children?: ReactNode;
  /** Scrollable body (default). Set false for flex-fill layouts (name-beaver). */
  scroll?: boolean;
  ctaLabel: string;
  onCta: () => void;
  ctaDisabled?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
}

/** Shared page for the 8 onboarding steps — progress dots, title, content, and
 *  a pinned CTA (+ optional skip link), matching the prototype's layout. */
export function OnboardingScaffold({
  step,
  hero,
  heroAspect,
  heroFocusY,
  title,
  titleStyle,
  subtitle,
  children,
  scroll = true,
  ctaLabel,
  onCta,
  ctaDisabled,
  onSkip,
  skipLabel = 'Skip for now',
}: OnboardingScaffoldProps) {
  const insets = useSafeAreaInsets();

  const heading = (
    <>
      <Text style={[titleStyle, styles.title]}>{title}</Text>
      {subtitle ? <Text style={[obText.body, styles.subtitle]}>{subtitle}</Text> : null}
      {children}
    </>
  );

  return (
    <View style={styles.root}>
      {hero ? (
        <HeroImage slot={hero} aspect={heroAspect} focusY={heroFocusY} />
      ) : null}

      <View
        style={[
          styles.content,
          {
            paddingTop: hero ? sc(8) : insets.top + sc(8),
            paddingBottom: insets.bottom + sc(26),
          },
        ]}
      >
        <ProgressDots step={step} />

        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {heading}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.flexBody]}>{heading}</View>
        )}

        <View style={styles.footer}>
          <OnboardingButton label={ctaLabel} onPress={onCta} disabled={ctaDisabled} />
          {onSkip ? <TextLink label={skipLabel} onPress={onSkip} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: obColors.screen },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: sc(24) },
  scrollBody: { flexGrow: 1, paddingTop: sc(22) },
  flexBody: { paddingTop: sc(22) },
  title: { color: obColors.text },
  subtitle: { color: obColors.textMuted, marginTop: sc(10) },
  footer: { paddingTop: sc(14) },
});
