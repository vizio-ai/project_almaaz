import { useRouter, useLocalSearchParams } from 'expo-router';
import { PhoneEntryScreen, useAuth } from '@shared/auth';

export default function PhoneEntryRoute() {
  const router = useRouter();
  const { sendOtp, isLoading, error, clearError } = useAuth();
  const { mode } = useLocalSearchParams<{ mode?: string }>();

  const handleSubmit = async (phone: string) => {
    const ok = await sendOtp(phone);
    if (ok) {
      router.push({ pathname: '/auth/otp', params: { phone } });
    }
  };

  return (
    <PhoneEntryScreen
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
      onClearError={clearError}
      mode={mode === 'signup' ? 'signup' : 'signin'}
    />
  );
}
