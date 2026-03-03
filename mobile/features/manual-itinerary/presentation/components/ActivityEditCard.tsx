import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { X, Clock2, MapPin } from 'lucide-react-native';
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

export interface ActivityEditCardProps {
  title?: string;
  name: string;
  timeLabel?: string;
  placeLabel?: string;
  timeValue: string;
  placeValue: string;
  onChangeName: (value: string) => void;
  onPressTime?: () => void;
  onPressPlace?: () => void;
   dayPart?: 'morning' | 'afternoon' | 'evening' | null;
   onChangeDayPart?: (value: 'morning' | 'afternoon' | 'evening') => void;
  onCancel?: () => void;
  onSave?: () => void;
  onClose?: () => void;
}

export function ActivityEditCard({
  title = 'Visit Nakano Dori',
  name,
  timeLabel = 'Time',
  placeLabel = 'Place',
  timeValue,
  placeValue,
  onChangeName,
  onPressTime,
  onPressPlace,
  dayPart,
  onChangeDayPart,
  onCancel,
  onSave,
  onClose,
}: ActivityEditCardProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');

  return (
    <View style={styles.card}>
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
            style={styles.pickerTrigger}
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
            style={styles.pickerTrigger}
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

      {/* Day part selector */}
      <View style={styles.dayPartRow}>
        <AppText style={[styles.pickerLabel, { color: textColor }]}>Day part</AppText>
        <View style={styles.dayPartChips}>
          {(['morning', 'afternoon', 'evening'] as const).map((part) => {
            const isActive = dayPart === part;
            return (
              <TouchableOpacity
                key={part}
                style={[
                  styles.dayPartChip,
                  isActive && { backgroundColor: textColor },
                ]}
                activeOpacity={0.8}
                onPress={() => onChangeDayPart?.(part)}
              >
                <AppText
                  style={[
                    styles.dayPartLabel,
                    { color: isActive ? '#FAFAFA' : secondary },
                  ]}
                >
                  {part.charAt(0).toUpperCase() + part.slice(1)}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Footer buttons */}
      <View style={styles.footerRow}>
        <View style={styles.footerCol}>
          <PrimaryButton
            label="Cancel"
            variant="outline"
            onPress={onCancel}
            style={styles.footerButton}
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
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
  dayPartRow: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  dayPartChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayPartChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    backgroundColor: '#FFFFFF',
  },
  dayPartLabel: {
    ...typography.xs,
    fontWeight: '500',
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
});

