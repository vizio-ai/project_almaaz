import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { AppText, useThemeColor } from '@shared/ui-kit';
import { Profile } from '../../domain/entities/Profile';

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile: boolean;
  onFollowingPress?: () => void;
  onFollowersPress?: () => void;
}

export function ProfileHeader({ profile, isOwnProfile, onFollowingPress, onFollowersPress }: ProfileHeaderProps) {
  const bg = useThemeColor('background');
  const text = useThemeColor('labelText');
  const secondary = useThemeColor('textSecondary');

  const displayName = [profile.name, profile.surname].filter(Boolean).join(' ') || 'Traveler';
  const initials =
    (profile.name?.[0] ?? '').toUpperCase() + (profile.surname?.[0] ?? '').toUpperCase() || '?';

  return (
    <View style={styles.profileHeader}>
      <View style={[styles.avatar, { backgroundColor: text }]}>
        {profile.avatarUrl ? (
          <Image
            source={{
              uri:
                profile.avatarUrl +
                (profile.updatedAt ? `?v=${new Date(profile.updatedAt).getTime()}` : ''),
            }}
            style={styles.avatarImg}
          />
        ) : (
          <AppText style={[styles.avatarText, { color: bg }]}>{initials}</AppText>
        )}
      </View>
      <View style={styles.profileInfo}>
        <AppText style={[styles.displayName, { color: text }]}>{displayName}</AppText>
        {isOwnProfile ? (
          <View style={styles.statsRowWrap}>
            <TouchableOpacity activeOpacity={0.7} onPress={onFollowingPress}>
              <AppText>
                <AppText style={styles.statsCount}>{profile.followingCount}</AppText>
                <AppText style={styles.statsRow}>{' Following'}</AppText>
              </AppText>
            </TouchableOpacity>
            <AppText style={styles.statsRow}> | </AppText>
            <TouchableOpacity activeOpacity={0.7} onPress={onFollowersPress}>
              <AppText>
                <AppText style={styles.statsCount}>{profile.followersCount}</AppText>
                <AppText style={styles.statsRow}>{' Followers'}</AppText>
              </AppText>
            </TouchableOpacity>
          </View>
        ) : (
          <AppText style={[styles.statsRow, { color: secondary }]}>
            {profile.followingCount} Following | {profile.followersCount} Followers
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarText: { fontSize: 26, fontWeight: '700' },
  profileInfo: { flex: 1 },
  displayName: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  statsRowWrap: { flexDirection: 'row', alignItems: 'center' },
  statsCount: { fontSize: 16, fontWeight: '500', color: '#09090B' },
  statsRow: { fontSize: 14, fontWeight: '400', color: '#09090B' },
});
