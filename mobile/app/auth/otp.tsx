import { useLocalSearchParams, useRouter } from 'expo-router';
import { OtpVerificationScreen, useAuth } from '@shared/auth';
import { useSession } from '@shared/auth';

export default function OtpRoute() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { verifyOtp, sendOtp, isLoading, error, clearError } = useAuth();
  const { setSession } = useSession();

  const handleSubmit = async (code: string) => {
    const authSession = await verifyOtp(phone ?? '', code);
    if (authSession) {
      setSession(authSession);
    }
  };

  const handleResend = async () => {
    if (phone) await sendOtp(phone);
  };

  return (
    <OtpVerificationScreen
      phone={phone ?? ''}
      onSubmit={handleSubmit}
      onResend={handleResend}
      isLoading={isLoading}
      error={error}
      onClearError={clearError}
    />
  );
}
