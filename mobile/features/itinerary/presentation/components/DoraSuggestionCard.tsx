import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { AppText } from '@shared/ui-kit';

interface DoraSuggestionCardProps {
  text: string;
  onPress: (text: string) => void;
}

export function DoraSuggestionCard({ text, onPress }: DoraSuggestionCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(text)}
      activeOpacity={0.7}
    >
      <AppText style={styles.text} numberOfLines={2}>
        {text}
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 6,
    padding: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 16,
    color: '#71717A',
  },
});
