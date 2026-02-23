import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { Ionicons } from '@expo/vector-icons';

const WARNING_BORDER = '#DC2626';
const WARNING_BG = '#FFF1F2';

interface WarningBannerProps {
  message: string;
  onDismiss: () => void;
}

export function WarningBanner({ message, onDismiss }: WarningBannerProps) {
  return (
    <TouchableOpacity
      style={[styles.banner, { backgroundColor: WARNING_BG, borderColor: WARNING_BORDER }]}
      onPress={onDismiss}
      activeOpacity={0.8}
    >
      <Ionicons
        name="alert-circle-outline"
        size={20}
        color={WARNING_BORDER}
        style={styles.icon}
      />
      <AppText style={[styles.text, { color: WARNING_BORDER }]}>{message}</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
});
