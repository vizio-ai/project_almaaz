import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { X, ChevronDown } from 'lucide-react-native';
import {
  AppText,
  AppInput,
  PrimaryButton,
  spacing,
  radii,
  typography,
  useThemeColor,
  elevatedCard,
} from '@shared/ui-kit';

export interface AccommodationEditCardProps {
  title?: string;
  selectedName: string;
  onPressSelect?: () => void;
  onClose?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
}

export function AccommodationEditCard({
  title = 'Accommodation',
  selectedName,
  onPressSelect,
  onClose,
  onDelete,
  onSave,
}: AccommodationEditCardProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <AppText style={[styles.headerTitle, { color: textColor }]}>{title}</AppText>
        <TouchableOpacity style={styles.iconButton} onPress={onClose} activeOpacity={0.7}>
          <X size={16} color={secondary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* Description placeholder (şimdilik gizli, tasarıma uyum için tutuluyor) */}
      {/* Select row */}
      <View style={styles.selectBlock}>
        <AppText style={[styles.selectLabel, { color: textColor }]}>Place</AppText>
        <TouchableOpacity
          style={styles.selectTrigger}
          onPress={onPressSelect}
          activeOpacity={0.8}
        >
          <AppText style={[styles.selectText, { color: textColor }]} numberOfLines={1}>
            {selectedName}
          </AppText>
          <ChevronDown size={16} color={secondary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* Footer buttons */}
      <View style={styles.footerRow}>
        <View style={styles.footerCol}>
          <PrimaryButton
            label="Delete"
            variant="outline"
            onPress={onDelete}
            style={[styles.footerButton, styles.deleteButton]}
            labelStyle={styles.deleteLabel}
          />
        </View>
        <View style={styles.footerCol}>
          <PrimaryButton
            label="Save"
            onPress={onSave}
            style={styles.footerButton}
          />
        </View>
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
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.lg,
  },
  headerTitle: {
    flex: 1,
    ...typography.sm,
    fontWeight: '600',
    lineHeight: 20,
  },
  iconButton: {
    height: 24,
    width: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBlock: {
    alignSelf: 'stretch',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  selectLabel: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
  },
  selectTrigger: {
    height: 36,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  selectText: {
    flex: 1,
    ...typography.sm,
    lineHeight: 20,
  },
  footerRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  footerCol: {
    flex: 1,
  },
  footerButton: {
    // Let PrimaryButton control vertical padding/height to avoid clipping label text
  },
  deleteButton: {
    borderColor: '#A1A1AA',
  },
  deleteLabel: {
    color: '#DC2626',
  },
});

