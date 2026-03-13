import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, colors, typography, spacing, radii } from '@shared/ui-kit';

interface DoraMessageProps {
  role: 'user' | 'assistant';
  content: string;
  userInitials?: string;
}

const c = colors.light;

export function DoraMessage({ role, content, userInitials = '?' }: DoraMessageProps) {
  if (role === 'assistant') {
    return (
      <View style={styles.aiRow}>
        <View style={styles.aiAvatar}>
          <AppText style={styles.aiAvatarText}>D</AppText>
        </View>
        <View style={styles.aiContent}>
          <AppText style={styles.aiText}>{content}</AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.userRow}>
      <View style={styles.userBubble}>
        <AppText style={styles.userText}>{content}</AppText>
      </View>
      <View style={styles.userAvatar}>
        <AppText style={styles.userAvatarText}>{userInitials}</AppText>
      </View>
    </View>
  );
}

export function TypingIndicator() {
  return (
    <View style={styles.aiRow}>
      <View style={styles.aiAvatar}>
        <AppText style={styles.aiAvatarText}>D</AppText>
      </View>
      <View style={styles.aiContent}>
        <AppText style={styles.typingText}>···</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.labelText,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  aiAvatarText: {
    color: c.background,
    ...typography.base,
    fontWeight: typography.weights.bold,
  },
  aiContent: {
    flex: 1,
    paddingTop: spacing.sm - 2,
  },
  aiText: {
    fontSize: 15,
    lineHeight: 23,
    color: c.labelText,
  },
  typingText: {
    ...typography.featured,
    color: c.labelText,
    letterSpacing: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  userBubble: {
    backgroundColor: c.labelText,
    borderRadius: radii.xl,
    borderBottomRightRadius: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    maxWidth: '75%',
    marginRight: spacing.sm + spacing.xs,
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
    color: c.background,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.borderMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatarText: {
    color: c.labelText,
    ...typography.caption,
    fontWeight: typography.weights.semibold,
  },
});
