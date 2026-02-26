import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSession } from '@shared/auth';
import { useProfile, ProfileScreen as ProfileScreenComponent } from '@shared/profile';
import { useFollow } from '@shared/follow';

export default function OtherUserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { session } = useSession();
  const router = useRouter();

  const { profile, isLoading, refresh } = useProfile(userId);
  const { isFollowing, isFollowLoading, toggleFollow } = useFollow(session?.user.id, userId ?? '');

  return (
    <ProfileScreenComponent
      profile={profile}
      isLoading={isLoading}
      isOwnProfile={false}
      onRefresh={refresh}
      onEditPress={() => {}}
      onLogout={() => {}}
      isFollowing={isFollowing}
      isFollowLoading={isFollowLoading}
      onFollowToggle={toggleFollow}
    />
  );
}
