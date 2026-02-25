import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSession } from '@shared/auth';
import { useProfile } from '@shared/profile';
import { AppHeader, AppText, useThemeColor } from '@shared/ui-kit';

export default function MyTripsScreen() {
  const { session } = useSession();
  const { profile } = useProfile(session?.user.id);
  const bg = useThemeColor('background');
  const secondary = useThemeColor('textSecondary');

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AppHeader showAdminLabel={profile?.role === 'admin'} />
      <View style={styles.body}>
        <AppText style={[styles.placeholder, { color: secondary }]}>My Trips — Coming soon</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { fontSize: 14 },
});
