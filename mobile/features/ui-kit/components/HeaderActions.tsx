import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography, spacing, radii } from '../theme';

export interface HeaderActionsProps {
  /** Called when the save button is pressed. */
  onSave?: () => void;
  /** Label shown next to the save icon. Defaults to "Save". */
  saveLabel?: string;
  /** Shows a spinner inside the save button when true. */
  isSaving?: boolean;
  /** Called when the share button is pressed. */
  onShare?: () => void;
  /** Called when the ⋯ more-options button is pressed. */
  onMoreOptions?: () => void;
}

export function HeaderActions({
  onSave,
  saveLabel = 'Save',
  isSaving = false,
  onShare,
  onMoreOptions,
}: HeaderActionsProps) {
  const textColor = useThemeColor('text');
  const border = useThemeColor('border');

  return (
    <View style={styles.row}>
      {onSave && (
        <TouchableOpacity
          onPress={onSave}
          disabled={isSaving}
          style={[styles.saveBtn, { backgroundColor: border }]}
          activeOpacity={0.75}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={textColor} />
          ) : (
            <Ionicons name="bookmark-outline" size={16} color={textColor} />
          )}
          <AppText style={[styles.saveLabel, { color: textColor }]}>{saveLabel}</AppText>
        </TouchableOpacity>
      )}

      {onShare && (
        <TouchableOpacity onPress={onShare} style={styles.iconBtn} hitSlop={8} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={22} color={textColor} />
        </TouchableOpacity>
      )}

      {onMoreOptions && (
        <TouchableOpacity
          onPress={onMoreOptions}
          style={styles.iconBtn}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={textColor} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
  },
  saveLabel: {
    ...typography.caption,
    fontWeight: typography.weights.medium,
  },
  iconBtn: {
    padding: spacing.xs,
  },
});
