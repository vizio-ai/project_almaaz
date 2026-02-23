import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText } from '@shared/ui-kit';

interface ProfileActionButtonsProps {
  onEditPress: () => void;
  onSharePress?: () => void;
}

export function ProfileActionButtons({ onEditPress, onSharePress }: ProfileActionButtonsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={onEditPress} activeOpacity={0.8}>
        <AppText style={styles.btnText}>Edit Profile</AppText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={onSharePress} activeOpacity={0.8}>
        <AppText style={styles.btnText}>Share Profile</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  btn: {
    flex: 1,
    borderRadius: 999,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#18181B',
  },
});
