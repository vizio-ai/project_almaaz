import React, { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useSession } from '@shared/auth';
import { useProfile, ProfileScreen as ProfileScreenComponent } from '@shared/profile';
import { useFollow } from '@shared/follow';
import { useUserTrips } from '@shared/trips';

export default function OtherUserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { session } = useSession();

  const { profile, isLoading, refresh } = useProfile(userId);
  const { isFollowing, isLoading: isFollowLoading, toggleFollow } = useFollow(session?.user.id, userId ?? '');
  const { trips, isLoading: isTripsLoading } = useUserTrips(userId);

  const handleFollowToggle = useCallback(async () => {
    await toggleFollow();
    refresh();
  }, [toggleFollow, refresh]);

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
      onFollowToggle={handleFollowToggle}
      userTrips={trips}
      isTripsLoading={isTripsLoading}
    />
  );
}
