import { Pressable, StyleSheet, Text } from 'react-native';

import { obColors, obText } from '../theme';

interface TextLinkProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

/** Centered rust text link — the prototype's "Not now" / "Skip for now" /
 *  "Already have an account? Sign in" affordance. ≥44pt tap target. */
export function TextLink({ label, onPress, disabled = false }: TextLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
    >
      <Text style={[obText.link, styles.text]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  text: { color: obColors.link, textAlign: 'center' },
});
