import { Component, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressButton } from '@/components/ui/PressButton';
import { colors, spacing, textStyles } from '@/theme';

interface Props {
  /** Names the screen in the fallback copy, e.g. "Home". */
  screen: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Per-screen error boundary (spec §2.1): friendly fallback + retry. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Detailed log for us; friendly message for the user.
    console.error(`[ErrorBoundary:${this.props.screen}]`, error);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={[textStyles.headerL, styles.title]}>
            Something broke on {this.props.screen}
          </Text>
          <Text style={[textStyles.body, styles.copy]}>
            Not your fault. Give it another go.
          </Text>
          <PressButton
            label="TRY AGAIN"
            onPress={() => this.setState({ error: null })}
            style={styles.button}
          />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  copy: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});
