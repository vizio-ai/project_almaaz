import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" options={{ gestureEnabled: false }} />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
