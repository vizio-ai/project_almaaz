import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';

interface ResendCodeBlockProps {
  label: string;
  actionText: string;
  onPress: () => void | Promise<void>;
  cooldownSeconds?: number;
}

export function ResendCodeBlock({
  label,
  actionText,
  onPress,
  cooldownSeconds = 120,
}: ResendCodeBlockProps) {
  const textColor = useThemeColor('text');
  const secondaryText = useThemeColor('textSecondary');
  const [cooldownRemaining, setCooldownRemaining] = useState(cooldownSeconds);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => setCooldownRemaining((r) => r - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const handlePress = useCallback(async () => {
    if (cooldownRemaining > 0 || isLoading) return;
    setIsLoading(true);
    try {
      await onPress();
      setCooldownRemaining(cooldownSeconds);
    } finally {
      setIsLoading(false);
    }
  }, [cooldownRemaining, isLoading, onPress, cooldownSeconds]);

  const disabled = cooldownRemaining > 0 || isLoading;
  const baseText = actionText.replace(/\s*\(\d+\s*sec\)\s*$/i, '').trim();
  const displayText =
    cooldownRemaining > 0 ? `${baseText} (${cooldownRemaining}s)` : baseText;

  return (
    <View style={styles.container}>
      <AppText style={[styles.label, { color: secondaryText }]}>{label}</AppText>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <AppText style={[styles.action, { color: textColor, opacity: disabled ? 0.6 : 1 }]}>{displayText}</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 20,
    gap: 4,
  },
  label: { fontSize: 14 },
  action: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
