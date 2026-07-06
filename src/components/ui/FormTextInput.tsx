import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radii, spacing, textStyles } from '@/theme';

interface FormTextInputProps extends TextInputProps {
  label: string;
  errorText?: string | null;
}

export function FormTextInput({ label, errorText, ...inputProps }: FormTextInputProps) {
  return (
    <View style={styles.container}>
      <Text style={[textStyles.headerS, styles.label]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textSecondary}
        style={[textStyles.body, styles.input, !!errorText && styles.inputError]}
        {...inputProps}
      />
      {!!errorText && (
        <Text style={[textStyles.caption, styles.error]}>{errorText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxs,
  },
  label: {
    color: colors.textPrimary,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
  },
});
