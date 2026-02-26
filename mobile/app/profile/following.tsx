import React from 'react';
import { useRouter } from 'expo-router';
import { useSession } from '@shared/auth';
import { useFollowList, FollowListScreen } from '@shared/follow';

export default function FollowingScreen() {
  const { session } = useSession();
  const router = useRouter();
  const { users, isLoading } = useFollowList(session?.user.id, 'following');

  return (
    <FollowListScreen
      title="Following"
      users={users}
      isLoading={isLoading}
      onBack={() => router.back()}
      onUserPress={userId => router.push(`/profile/${userId}`)}
    />
  );
}
