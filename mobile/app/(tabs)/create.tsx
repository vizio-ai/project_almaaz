import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSession } from '@shared/auth';
import { useProfile } from '@shared/profile';
import { DoraConversationScreen } from '@shared/itinerary';
import { AppText } from '@shared/ui-kit';
import { BlurView } from 'expo-blur';

export default function CreateScreen() {
  const { session } = useSession();
  const { profile } = useProfile(session?.user.id);
  const router = useRouter();
  const { fromOnboarding } = useLocalSearchParams<{ fromOnboarding?: string }>();
  const [showDialog, setShowDialog] = useState(fromOnboarding === 'true');

  return (
    <>
      <DoraConversationScreen
        userName={profile?.name}
        persona={profile?.persona}
      />
      <Modal visible={showDialog} transparent animationType="fade">
        <BlurView intensity={20} tint="dark" style={styles.scrim}>
          <View style={styles.dialog}>
            <AppText style={styles.title}>I want to...</AppText>
            <View style={styles.options}>
              <TouchableOpacity onPress={() => setShowDialog(false)}>
                <AppText style={styles.option}>... plan a trip</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowDialog(false);
                  router.navigate('/(tabs)/my-trips');
                }}
              >
                <AppText style={styles.option}>... log my past trip</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowDialog(false);
                  router.navigate('/(tabs)/discover');
                }}
              >
                <AppText style={styles.option}>... explore ideas</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowDialog(false);
                  router.navigate('/(tabs)');
                }}
              >
                <AppText style={styles.option}>... decide this later</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 16,
  },
  options: {
    gap: 10,
  },
  option: {
    fontSize: 14,
    fontWeight: '400',
    color: '#18181B',
    textDecorationLine: 'underline',
  },
});
