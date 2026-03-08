import { Stack } from 'expo-router';

export default function ItineraryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
