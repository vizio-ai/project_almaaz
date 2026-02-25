import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@shared/ui-kit';

interface DoraMessageProps {
  role: 'user' | 'assistant';
  content: string;
  userInitials?: string;
}

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
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  aiAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  aiContent: {
    flex: 1,
    paddingTop: 6,
  },
  aiText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#18181B',
  },
  typingText: {
    fontSize: 22,
    color: '#18181B',
    letterSpacing: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  userBubble: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: '75%',
    marginRight: 10,
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatarText: {
    color: '#18181B',
    fontSize: 13,
    fontWeight: '600',
  },
});
