import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@shared/auth';
import { AppHeader, AppText, colors, spacing, typography, radii } from '@shared/ui-kit';

export default function DeactivatedScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBackToLogin = async () => {
    await logout();
    router.replace('/auth');
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <AppHeader variant="dark" />

      <View style={styles.body}>
        <Ionicons
          name="lock-closed-outline"
          size={64}
          color={colors.light.mainText}
          style={styles.icon}
        />
        <AppText style={styles.title}>Your Account Has Been Deactivated</AppText>
        <AppText style={styles.message}>
          Your access has been suspended by an administrator. You cannot log in at this
          time. Please contact support if you believe this is an error.
        </AppText>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={handleBackToLogin}
        >
          <AppText style={styles.buttonText}>Back to Login</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  icon: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.lg,
    fontWeight: typography.weights.bold,
    color: colors.light.mainText,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  message: {
    ...typography.sm,
    color: colors.light.subText,
    textAlign: 'left',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  button: {
    backgroundColor: colors.light.mainText,
    borderRadius: radii.full,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.base,
    fontWeight: typography.weights.medium,
    color: colors.light.background,
  },
});
