import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radii, textStyles } from '@/theme';

/** Depth of the 3D bottom lip the face pushes down into. */
const LIP_DEPTH = 5;

type Variant = 'primary' | 'info';

const variantColors: Record<Variant, { face: string; lip: string }> = {
  primary: { face: colors.primary, lip: colors.primaryPressed },
  info: { face: colors.info, lip: colors.infoPressed },
};

interface PressButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * The signature 3D "press" button (aesthetic §4, LOCKED): solid accent fill
 * with a darker bottom lip; the face visibly pushes down into the lip on tap.
 */
export function PressButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: PressButtonProps) {
  const [pressed, setPressed] = useState(false);
  const { face, lip } = variantColors[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.container, disabled && styles.disabled, style]}
    >
      <View style={[styles.lip, { backgroundColor: lip }]} />
      <View
        style={[
          styles.face,
          { backgroundColor: face },
          pressed && styles.facePressed,
        ]}
      >
        <Text style={[textStyles.button, styles.label]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: LIP_DEPTH,
  },
  lip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: LIP_DEPTH,
    bottom: 0,
    borderRadius: radii.pill,
  },
  face: {
    // ≥44pt target (spec §2.1) even before the lip adds height.
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: radii.pill,
  },
  facePressed: {
    transform: [{ translateY: LIP_DEPTH }],
  },
  label: {
    color: colors.textOnPrimary,
  },
  disabled: {
    opacity: 0.45,
  },
});
