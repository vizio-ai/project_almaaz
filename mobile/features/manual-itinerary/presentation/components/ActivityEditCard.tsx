import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { X, Clock2, MapPin } from 'lucide-react-native';
import {
  AppText,
  AppInput,
  PrimaryButton,
  FilterChipGroup,
  spacing,
  radii,
  typography,
  useThemeColor,
  elevatedCard,
  type FilterChipOption,
} from '@shared/ui-kit';

type ActivityType = 'park' | 'museum' | 'food' | 'shopping' | 'historic' | 'beach';

const ACTIVITY_TYPE_OPTIONS: FilterChipOption<ActivityType>[] = [
  { value: 'park',     label: 'Park' },
  { value: 'museum',   label: 'Museum' },
  { value: 'food',     label: 'Food & Drink' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'historic', label: 'Historic place' },
  { value: 'beach',    label: 'Beach' },
];

export interface ActivityEditCardProps {
  title?: string;
  name: string;
  /** Optional semantic activity type: controls first tag icon/label on the card. */
  activityType?: ActivityType | null;
  timeLabel?: string;
  placeLabel?: string;
  timeValue: string;
  placeValue: string;
  onChangeName: (value: string) => void;
  onChangeActivityType?: (value: ActivityType) => void;
  onPressTime?: () => void;
  onPressPlace?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onClose?: () => void;
}

export function ActivityEditCard({
  title = 'Visit Nakano Dori',
  name,
  activityType = 'park',
  timeLabel = 'Time',
  placeLabel = 'Place',
  timeValue,
  placeValue,
  onChangeName,
  onChangeActivityType,
  onPressTime,
  onPressPlace,
  onDelete,
  onSave,
  onClose,
}: ActivityEditCardProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const border    = useThemeColor('border');
  const surface   = useThemeColor('surface');
  const background = useThemeColor('background');

  return (
    <View style={[styles.card, { backgroundColor: background, borderColor: border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <AppText style={[styles.headerTitle, { color: textColor }]}>{title}</AppText>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={onClose} activeOpacity={0.7}>
          <X size={16} color={secondary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* Description placeholder (tasarımdaki kısa metin için) */}

      {/* Activity name input */}
      <View style={styles.fieldBlock}>
        <AppText style={[styles.fieldLabel, { color: textColor }]}>
          Activity Name <AppText style={[styles.optional, { color: secondary }]}>(Optional)</AppText>
        </AppText>
        <AppInput
          value={name}
          onChangeText={onChangeName}
          placeholder="Visit Nakano Dori"
        />
      </View>

      {/* Time + Place pickers */}
      <View style={styles.pickersRow}>
        <View style={styles.pickerColSmall}>
          <AppText style={[styles.pickerLabel, { color: textColor }]}>{timeLabel}</AppText>
          <TouchableOpacity
            style={[styles.pickerTrigger, { backgroundColor: surface, borderColor: border }]}
            onPress={onPressTime}
            activeOpacity={0.8}
          >
            <Clock2 size={16} color={secondary} strokeWidth={1.8} />
            <AppText style={[styles.pickerText, { color: textColor }]} numberOfLines={1}>
              {timeValue || '9:00 AM'}
            </AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.pickerColLarge}>
          <AppText style={[styles.pickerLabel, { color: textColor }]}>{placeLabel}</AppText>
          <TouchableOpacity
            style={[styles.pickerTrigger, { backgroundColor: surface, borderColor: border }]}
            onPress={onPressPlace}
            activeOpacity={0.8}
          >
            <MapPin size={16} color={secondary} strokeWidth={1.8} />
            <AppText style={[styles.pickerText, { color: textColor }]} numberOfLines={1}>
              {placeValue || 'Nakano Dori, Tokyo, Japan'}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Activity type selector (bottom row) */}
      <View style={styles.typeRow}>
        <AppText style={[styles.pickerLabel, { color: textColor }]}>Activity type</AppText>
        <FilterChipGroup
          options={ACTIVITY_TYPE_OPTIONS}
          value={activityType ?? null}
          onChange={(type) => type && onChangeActivityType?.(type)}
        />
      </View>

      {/* Footer buttons */}
      <View style={styles.footerRow}>
        {/* Top row: Cancel + Save */}
        <View style={styles.footerTopRow}>
          <View style={styles.footerCol}>
            <PrimaryButton
              label="Cancel"
              variant="outline"
              onPress={onClose}
              style={[styles.footerButton, styles.deleteButton]}
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

        {/* Bottom row: Delete full-width */}
        <View style={styles.footerBottomRow}>
          <PrimaryButton
            label="Delete"
            variant="outline"
            onPress={onDelete}
            style={[styles.footerButton, styles.deleteButton]}
            labelStyle={styles.deleteLabel}
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
    borderWidth: 1,
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
    gap: spacing.lg,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  headerTitle: {
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
  fieldBlock: {
    alignSelf: 'stretch',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  fieldLabel: {
    ...typography.sm,
    lineHeight: 16,
    fontWeight: '500',
  },
  optional: {
    ...typography.sm,
  },
  pickersRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  typeRow: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  pickerColSmall: {
    width: 110,
    flexDirection: 'column',
    gap: spacing.xs,
  },
  pickerColLarge: {
    flex: 1,
    flexDirection: 'column',
    gap: spacing.xs,
  },
  pickerLabel: {
    ...typography.sm,
    fontWeight: '500',
    lineHeight: 16,
  },
  pickerTrigger: {
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  pickerText: {
    flex: 1,
    ...typography.sm,
    lineHeight: 20,
  },
  footerRow: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  footerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerBottomRow: {
    marginTop: spacing.xs,
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

