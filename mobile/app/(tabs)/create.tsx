import React from 'react';
import { useSession } from '@shared/auth';
import { useProfile } from '@shared/profile';
import { DoraConversationScreen } from '@shared/itinerary';

export default function CreateScreen() {
  const { session } = useSession();
  const { profile } = useProfile(session?.user.id);

  return (
    <DoraConversationScreen
      userName={profile?.name}
      persona={profile?.persona}
    />
  );
}
