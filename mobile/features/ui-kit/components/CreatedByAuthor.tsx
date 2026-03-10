import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography } from '../theme';
import AnonymousUserIcon from '../../../assets/images/anonymous_user_icon.svg';

export interface CreatedByAuthorProps {
  userName: string;
  /** When set, shows user avatar; otherwise shows default anonymous icon. */
  avatarUrl?: string | null;
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
        <AnonymousUserIcon width={12} height={12} />
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
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  text: {
    ...typography.sm,
    fontWeight: '400',
  },
});
