import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { spacing, radii, typography, elevatedCard } from '../theme';
import PencilIcon from '../../../assets/images/pencil.svg';

export interface NoteCardProps {
  title?: string;
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
}

export function NoteCard({
  title = 'Note',
  value,
  placeholder = 'Add a note...',
  onChangeText,
}: NoteCardProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AppText style={[styles.titleText, { color: textColor }]}>{title}</AppText>
        </View>
        <View style={styles.iconButton}>
          <PencilIcon width={16} height={16} />
        </View>
      </View>

      <View style={styles.body}>
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder={placeholder}
          placeholderTextColor={secondary}
          multiline
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    ...elevatedCard,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    minHeight: 87,
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    alignSelf: 'stretch',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  titleText: {
    alignSelf: 'stretch',
    fontWeight: '600',
    ...typography.sm,
  },
  iconButton: {
    height: 24,
    width: 24,
    borderRadius: 6,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  body: {
    alignSelf: 'stretch',
  },
  input: {
    ...typography.sm,
    textAlignVertical: 'top',
  },
});

