import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { AppText, useThemeColor, typography, spacing, radii } from '@shared/ui-kit';
import type { TravelInfo, TravelInfoType } from '../../domain/entities/TravelInfo';
import { Ionicons } from '@expo/vector-icons';
import PencilIcon from '../../../../assets/images/pencil.svg';

export interface TravelInfoSectionProps {
  items: TravelInfo[];
  onAddPress?: () => void;
  onEditItem?: (item: TravelInfo) => void;
}

export function TravelInfoSection({ items, onAddPress, onEditItem }: TravelInfoSectionProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('background');
  const border = useThemeColor('border');

  const sections = React.useMemo(
    () => groupTravelInfoByType(items),
    [items],
  );

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
        <AppText style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>
          Travel Information
        </AppText>
        {onAddPress && (
        <TouchableOpacity onPress={onAddPress} hitSlop={8}>
          <PencilIcon width={16} height={16} />
        </TouchableOpacity>
        )}
      </View>
      {items.length === 0 ? (
        <AppText style={[styles.placeholderText, { color: secondary }]}>
          No travel info yet. Use the pencil icon to add your flights, rental cars, hotels or other details.
        </AppText>
      ) : (
        sections.map((section) => (
          <View key={section.type} style={styles.typeSection}>
            <View style={styles.typeHeaderRow}>
              <Ionicons
                name={
                  section.type === 'flight'
                    ? 'airplane-outline'
                    : section.type === 'rental_car'
                    ? 'car-outline'
                    : section.type === 'hotel'
                    ? 'bed-outline'
                    : 'document-text-outline'
                }
                size={16}
                color={secondary}
              />
              <AppText style={[styles.typeHeaderLabel, { color: textColor }]}>
                {labelForType(section.type)}
              </AppText>
            </View>

            {section.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={onEditItem ? () => onEditItem(item) : undefined}
                disabled={!onEditItem}
                hitSlop={8}
                style={styles.detailRowTouchable}
              >
                <View style={styles.detailRow}>
                  <View style={styles.detailBulletSpacer} />
                  <AppText style={[styles.detailText, { color: secondary }]}>
                    {formatDetailLine(item)}
                  </AppText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))
      )}
    </View>
  );
}

function labelForType(type: TravelInfoType): string {
  switch (type) {
    case 'flight':
      return 'Airplane Travel';
    case 'rental_car':
      return 'Rental Car';
    case 'hotel':
      return 'Accommodation';
    default:
      return 'Other Travel';
  }
}

function formatDetailLine(item: TravelInfo): string {
  const parts: string[] = [];
  if (item.provider) parts.push(item.provider);
  if (item.detail) parts.push(item.detail);
  const base = parts.join(' - ') || item.title;

  // For hotel and rental car, show range when endDatetime exists
  if (item.type === 'hotel' || item.type === 'rental_car') {
    const startLabel = item.type === 'hotel' ? 'Check-in' : 'Pickup';
    const endLabel = item.type === 'hotel' ? 'Check-out' : 'Drop-off';
    const startFormatted = formatDateTime(item.startDatetime ?? null);
    const endFormatted = formatDateTime(item.endDatetime ?? null);

    let range = '';
    if (startFormatted && endFormatted) {
      range = `${startLabel}: ${startFormatted} · ${endLabel}: ${endFormatted}`;
    } else if (startFormatted) {
      range = `${startLabel}: ${startFormatted}`;
    } else if (endFormatted) {
      range = `${endLabel}: ${endFormatted}`;
    }

    if (range) {
      return base ? `${base} - ${range}` : range;
    }
    return base;
  }

  // Default: single datetime appended
  if (item.startDatetime) {
    const formatted = formatDateTime(item.startDatetime);
    if (formatted) {
      return `${base} - ${formatted}`;
    }
  }
  return base;
}

function formatDateTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hh = String(hours).padStart(2, '0');

  return `${day}.${month}.${year} - ${hh}:${minutes} ${ampm}`;
}

function groupTravelInfoByType(items: TravelInfo[]): { type: TravelInfoType; items: TravelInfo[] }[] {
  const order: TravelInfoType[] = ['flight', 'rental_car', 'hotel', 'other'];
  const map = new Map<TravelInfoType, TravelInfo[]>();

  items.forEach((item) => {
    const list = map.get(item.type) ?? [];
    list.push(item);
    map.set(item.type, list);
  });

  return order
    .map((type) => {
      const list = map.get(type);
      return list && list.length > 0 ? { type, items: list } : null;
    })
    .filter((section): section is { type: TravelInfoType; items: TravelInfo[] } => !!section);
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
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
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.base,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  placeholderText: { ...typography.sm },
  typeSection: {
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },
  typeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  typeHeaderLabel: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
  },
  detailRowTouchable: {
    alignSelf: 'stretch',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  detailBulletSpacer: {
    width: 16,
    height: 16,
  },
  detailText: {
    flex: 1,
    ...typography.sm,
  },
});

