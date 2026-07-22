import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { obColors, obRadii, obText } from '../theme';

interface OnboardingFieldProps extends TextInputProps {
  label: string;
  errorText?: string | null;
}

/** Prototype input: bold label, near-white fill, hairline border, 12px radius.
 *  Border turns rust while an error is showing. */
export function OnboardingField({ label, errorText, ...inputProps }: OnboardingFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={[obText.label, styles.label]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={obColors.textMuted}
        style={[obText.field, styles.input, !!errorText && styles.inputError]}
        {...inputProps}
      />
      {!!errorText && <Text style={[obText.caption, styles.error]}>{errorText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 7 },
  label: { color: obColors.text },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: obRadii.input,
    backgroundColor: obColors.input,
    color: obColors.text,
    borderWidth: 1,
    borderColor: obColors.border,
  },
  inputError: { borderColor: obColors.link },
  error: { color: obColors.link },
});
