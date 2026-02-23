import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText, ThemedView } from '@shared/ui-kit';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <ThemedView style={styles.container}>
        <ThemedText variant="title">404</ThemedText>
        <ThemedText>This screen doesn't exist.</ThemedText>

        <Link href="/" style={styles.link}>
          <ThemedText variant="link">Go to home screen</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  link: {
    marginTop: 16,
  },
});
