import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { ErrorBanner } from './ErrorBanner';
import { WarningBanner } from './WarningBanner';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography, spacing } from '../theme';

interface AuthErrorSectionProps {
  error?: string | null;
  warning?: string | null;
  onDismissError?: () => void;
  onDismissWarning?: () => void;
  horizontalInset?: number;
}

export function AuthErrorSection({
  error,
  warning,
  onDismissError,
  onDismissWarning,
  horizontalInset = 24,
}: AuthErrorSectionProps) {
  const textColor = useThemeColor('text');
  const accentColor = useThemeColor('accent');
  const hasError = !!error || !!warning;

  if (!hasError) return null;

  return (
    <View style={styles.container}>
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={onDismissError}
          horizontalInset={horizontalInset}
        />
      )}
      {warning && (
        <WarningBanner message={warning} onDismiss={onDismissWarning ?? (() => {})} />
      )}
      <AppText style={[styles.doraLabel, { color: textColor }]}>
        dora<AppText style={{ color: accentColor }}>.</AppText>
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  doraLabel: {
    ...typography.featured,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
});
