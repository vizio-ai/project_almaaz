import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { AppText } from '@shared/ui-kit';

interface FollowButtonProps {
  isFollowing?: boolean;
  isFollowLoading?: boolean;
  onFollowToggle: () => void;
}

export function FollowButton({ isFollowing, isFollowLoading, onFollowToggle }: FollowButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.followBtn, isFollowing && styles.followBtnActive]}
      activeOpacity={0.7}
      onPress={onFollowToggle}
      disabled={isFollowLoading}
    >
      <AppText style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
        {isFollowLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  followBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#18181B',
    marginBottom: 20,
  },
  followBtnActive: {
    backgroundColor: '#18181B',
  },
  followBtnText: { fontSize: 14, fontWeight: '500', color: '#18181B' },
  followBtnTextActive: { color: '#FFFFFF' },
});
