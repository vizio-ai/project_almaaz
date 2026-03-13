import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography } from '../theme';

export interface CreatedByAuthorProps {
  userName: string;
  /** When set, shows user avatar; otherwise shows initials. */
  avatarUrl?: string | null;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0]?.[0]?.toUpperCase() ?? '?';
}

export function CreatedByAuthor({ userName, avatarUrl }: CreatedByAuthorProps) {
  const secondary = useThemeColor('textSecondary');
  const border = useThemeColor('border');

  return (
    <View style={styles.row}>
      {avatarUrl?.trim() ? (
        <Image
          source={{ uri: avatarUrl.trim() }}
          style={[styles.avatar, { backgroundColor: border }]}
        />
      ) : (
        <View style={[styles.initials, { backgroundColor: border }]}>
          <AppText style={styles.initialsText}>{getInitials(userName)}</AppText>
        </View>
      )}
      <AppText style={[styles.text, { color: secondary }]}>
        Created by {userName}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  initials: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 10,
  },
  text: {
    ...typography.sm,
    fontWeight: '400',
  },
});
