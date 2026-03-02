import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { AppText, useThemeColor, typography, spacing, radii } from '@shared/ui-kit';
import type { TravelInfo } from '../../domain/entities/TravelInfo';
import { Ionicons } from '@expo/vector-icons';
import PencilIcon from '../../../../assets/images/pencil.svg';

export interface TravelInfoSectionProps {
  items: TravelInfo[];
  onAddPress: () => void;
  onEditItem: (item: TravelInfo) => void;
}

export function TravelInfoSection({ items, onAddPress, onEditItem }: TravelInfoSectionProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: surface,
          borderColor: border,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
            },
            android: { elevation: 2 },
          }),
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <AppText style={[styles.cardTitle, { color: textColor }]}>
          Travel Information
        </AppText>
        <TouchableOpacity onPress={onAddPress} hitSlop={8} style={styles.addButton}>
        <PencilIcon width={16} height={16} />
        </TouchableOpacity>
      </View>
      {items.length === 0 ? (
        <AppText style={[styles.placeholderText, { color: secondary }]}>
          No travel info yet. Tap + to add.
        </AppText>
      ) : (
        items.map((t) => (
          <TravelInfoRow
            key={t.id}
            item={t}
            secondary={secondary}
            textColor={textColor}
            onEdit={() => onEditItem(t)}
          />
        ))
      )}
    </View>
  );
}

function TravelInfoRow({
  item,
  secondary,
  textColor,
  onEdit,
}: {
  item: TravelInfo;
  secondary: string;
  textColor: string;
  onEdit: () => void;
}) {
  const iconName =
    item.type === 'flight'
      ? 'airplane-outline'
      : item.type === 'rental_car'
      ? 'car-outline'
      : item.type === 'hotel'
      ? 'bed-outline'
      : ('document-text-outline' as const);
  const detail = [item.provider, item.detail].filter(Boolean).join(' · ') || item.title;

  return (
    <View style={styles.travelRow}>
      <Ionicons name={iconName} size={18} color={secondary} />
      <View style={styles.travelTextWrap}>
        <AppText style={[styles.travelTitle, { color: textColor }]}>{item.title}</AppText>
        {detail !== item.title && (
          <AppText style={[styles.travelDetail, { color: secondary }]}>{detail}</AppText>
        )}
      </View>
      <TouchableOpacity onPress={onEdit} hitSlop={8}>
        <PencilIcon width={16} height={16} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.lg,
    alignSelf: 'stretch',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  addButton: {
    marginLeft: 'auto',
  },
  cardTitle: { ...typography.base, fontWeight: typography.weights.semibold },
  placeholderText: { ...typography.sm },
  travelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  travelTextWrap: { flex: 1 },
  travelTitle: { ...typography.sm, fontWeight: typography.weights.medium },
  travelDetail: { ...typography.caption },
});

