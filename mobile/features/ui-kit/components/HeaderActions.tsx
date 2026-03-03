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
  const textColor = useThemeColor('labelText');
  const background = useThemeColor('background');
  const borderMuted = useThemeColor('borderMuted');
  const shadowColor = useThemeColor('shadowColor');

  return (
    <View style={styles.row}>
      {onSave && (
        <TouchableOpacity
          onPress={onSave}
          disabled={isSaving}
          style={[
            styles.saveBtn,
            {
              backgroundColor: background,
              borderColor: borderMuted,
              shadowColor,
            },
          ]}
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
        <TouchableOpacity
          onPress={onShare}
          style={[
            styles.iconBtn,
            {
              backgroundColor: background,
              borderColor: borderMuted,
              shadowColor,
            },
          ]}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={22} color={textColor} />
        </TouchableOpacity>
      )}

      {onMoreOptions && (
        <TouchableOpacity
          onPress={onMoreOptions}
          style={[
            styles.iconBtn,
            {
              backgroundColor: background,
              borderColor: borderMuted,
              shadowColor,
            },
          ]}
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
    gap: spacing.xs,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  saveLabel: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
    lineHeight: 20,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
