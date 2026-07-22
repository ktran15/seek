import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { obColors, obRadii, obText, sc } from '../theme';

type Variant = 'primary' | 'apple' | 'google';

const variantStyle: Record<Variant, { bg: string; fg: string; shadow: boolean }> = {
  primary: { bg: obColors.primary, fg: obColors.onPrimary, shadow: true },
  apple: { bg: obColors.apple, fg: obColors.onApple, shadow: false },
  google: { bg: obColors.google, fg: obColors.onGoogle, shadow: false },
};

interface OnboardingButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Flat full-width CTA from the onboarding prototype: solid fill, 15px radius,
 * Fraunces label. The primary variant carries the prototype's soft orange-tinted
 * drop shadow. Press feedback is a light dim (the prototype is flat — no 3D lip).
 */
export function OnboardingButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: OnboardingButtonProps) {
  const v = variantStyle[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg },
        v.shadow && styles.primaryShadow,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[obText.button, { color: v.fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: sc(52),
    borderRadius: obRadii.button,
    paddingVertical: sc(16),
    paddingHorizontal: sc(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Approximates `box-shadow: 0 12px 22px -12px #DE6B2F`.
  primaryShadow: {
    shadowColor: obColors.primary,
    shadowOffset: { width: 0, height: sc(10) },
    shadowOpacity: 0.45,
    shadowRadius: sc(12),
    elevation: 6,
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.5 },
});
