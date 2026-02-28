import React from 'react';
import { useRouter } from 'expo-router';
import { useSession } from '@shared/auth';
import { FollowConnectionsScreen } from '@shared/follow';

export default function FollowingScreen() {
  const { session } = useSession();
  const router = useRouter();
  const userId = session?.user.id ?? '';

  return (
    <FollowConnectionsScreen
      userId={userId}
      currentUserId={userId}
      initialTab="following"
      onBack={() => router.back()}
      onUserPress={id => router.push(`/profile/${id}`)}
    />
  );
}
