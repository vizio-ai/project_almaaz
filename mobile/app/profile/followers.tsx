import React from 'react';
import { useRouter } from 'expo-router';
import { useSession } from '@shared/auth';
import { useFollowList, FollowListScreen } from '@shared/follow';

export default function FollowersScreen() {
  const { session } = useSession();
  const router = useRouter();
  const { users, isLoading } = useFollowList(session?.user.id, 'followers');

  return (
    <FollowListScreen
      title="Followers"
      users={users}
      isLoading={isLoading}
      onBack={() => router.back()}
      onUserPress={userId => router.push(`/profile/${userId}`)}
    />
  );
}
