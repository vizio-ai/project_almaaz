import { useRouter } from 'expo-router';
import { WelcomeScreen } from '@shared/auth';
import { usePopularTrips } from '@shared/trips';

export default function WelcomeRoute() {
  const router = useRouter();
  const { trips } = usePopularTrips();

  return (
    <WelcomeScreen
      onLoginPress={() => router.push('/auth/phone?mode=signin')}
      onSignUpPress={() => router.push('/auth/phone?mode=signup')}
      trips={trips}
    />
  );
}
