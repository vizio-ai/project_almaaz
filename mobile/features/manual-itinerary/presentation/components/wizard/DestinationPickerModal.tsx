import React, { useState, useMemo } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, useThemeColor, spacing, typography, radii } from '@shared/ui-kit';

// Popular destinations (countries and major cities)
const DESTINATIONS = [
  'Japan',
  'France',
  'Italy',
  'United Kingdom',
  'Spain',
  'Germany',
  'Canada',
  'United States',
  'Australia',
  'New Zealand',
  'Thailand',
  'Vietnam',
  'Indonesia',
  'India',
  'South Korea',
  'Mexico',
  'Brazil',
  'Portugal',
  'Greece',
  'Turkey',
  'Egypt',
  'Morocco',
  'South Africa',
  'Switzerland',
  'Netherlands',
  'Belgium',
  'Austria',
  'Czech Republic',
  'Poland',
  'Russia',
  'Japan - Tokyo',
  'Japan - Kyoto',
  'France - Paris',
  'France - Lyon',
  'Italy - Rome',
  'Italy - Venice',
  'Italy - Florence',
  'Spain - Barcelona',
  'Spain - Madrid',
  'United Kingdom - London',
  'Thailand - Bangkok',
  'Thailand - Phuket',
  'Vietnam - Hanoi',
  'Vietnam - Ho Chi Minh City',
  'Indonesia - Bali',
  'South Korea - Seoul',
  'India - New Delhi',
  'India - Mumbai',
  'Mexico - Cancun',
  'Mexico - Mexico City',
  'Brazil - Rio de Janeiro',
  'Brazil - São Paulo',
  'Canada - Toronto',
  'Canada - Vancouver',
  'United States - New York',
  'United States - Los Angeles',
  'United States - Las Vegas',
  'United States - Miami',
  'Australia - Sydney',
  'Australia - Melbourne',
  'New Zealand - Auckland',
  'Portugal - Lisbon',
  'Greece - Athens',
  'Greece - Santorini',
  'Turkey - Istanbul',
];

export interface DestinationPickerModalProps {
  visible: boolean;
  selectedDestination: string;
  onSelect: (destination: string) => void;
  onClose: () => void;
}

export function DestinationPickerModal({
  visible,
  selectedDestination,
  onSelect,
  onClose,
}: DestinationPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const border = useThemeColor('border');
  const background = useThemeColor('background');
  const surface = useThemeColor('surface');
  const accent = useThemeColor('accent');

  const filteredDestinations = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return DESTINATIONS;
    return DESTINATIONS.filter((dest) => dest.toLowerCase().includes(query));
  }, [searchQuery]);

  const handleSelect = (destination: string) => {
    onSelect(destination);
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: background }]}>
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={[styles.header, { borderBottomColor: border }]}>
          <AppText style={[styles.headerTitle, { color: textColor }]}>
            Select Destination
          </AppText>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* ── Search input ────────────────────────────────────────── */}
        <View style={[styles.searchBox, { backgroundColor: surface, borderColor: border }]}>
          <Ionicons name="search" size={16} color={secondary} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search destination..."
            placeholderTextColor={secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={secondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Destinations list ───────────────────────────────────── */}
        <FlatList
          data={filteredDestinations}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isSelected = item === selectedDestination;
            return (
              <TouchableOpacity
                style={[
                  styles.destinationItem,
                  isSelected && { backgroundColor: accent },
                ]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <AppText
                  style={[
                    styles.destinationText,
                    { color: isSelected ? '#fff' : textColor },
                  ]}
                >
                  {item}
                </AppText>
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppText style={[styles.emptyText, { color: secondary }]}>
                No destinations found
              </AppText>
            </View>
          }
          scrollEnabled
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingTop: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    ...typography.base,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    ...typography.sm,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  destinationText: {
    ...typography.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyText: {
    ...typography.sm,
  },
});
