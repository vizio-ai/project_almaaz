import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors } from '../theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary — catches unexpected React errors, prevents white screen.
 * Wrapped around the root layout.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // TODO: Send to crash reporting service (e.g. Sentry) in production
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const c = colors.light;

      return (
        <View style={[styles.container, { backgroundColor: c.background }]}>
          <AppText style={[styles.title, { color: c.text }]}>Something went wrong</AppText>
          <AppText style={[styles.message, { color: c.textSecondary }]}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </AppText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: c.buttonPrimary }]}
            onPress={this.handleRetry}
            activeOpacity={0.85}
          >
            <AppText style={[styles.buttonText, { color: c.buttonPrimaryText }]}>Try Again</AppText>
          </TouchableOpacity>
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
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
