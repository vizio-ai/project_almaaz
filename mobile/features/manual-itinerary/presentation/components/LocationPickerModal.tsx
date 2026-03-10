import React, { useState, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Country, City, ICity, ICountry } from 'country-state-city';
import { AppText, useThemeColor, typography, spacing, radii } from '@shared/ui-kit';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface LocationPickerModalProps {
  visible: boolean;
  onSelect: (location: string) => void;
  onClose: () => void;
}

type ResultItem =
  | { type: 'city'; city: ICity; country: ICountry }
  | { type: 'country'; country: ICountry };

const allCountries = Country.getAllCountries();
const allCities = City.getAllCities();

export function LocationPickerModal({ visible, onSelect, onClose }: LocationPickerModalProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const border = useThemeColor('border');
  const background = useThemeColor('background');
  const surface = useThemeColor('surface');

  const [query, setQuery] = useState('');

  const results = useMemo<ResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const items: ResultItem[] = [];
    const countryMap = new Map(allCountries.map((c) => [c.isoCode, c]));

    // Match countries
    for (const country of allCountries) {
      if (country.name.toLowerCase().startsWith(q)) {
        items.push({ type: 'country', country });
      }
      if (items.length >= 50) break;
    }

    // Match cities
    for (const city of allCities) {
      if (city.name.toLowerCase().startsWith(q)) {
        const country = countryMap.get(city.countryCode);
        if (country) {
          items.push({ type: 'city', city, country });
        }
      }
      if (items.length >= 50) break;
    }

    return items;
  }, [query]);

  const handleSelect = useCallback(
    (item: ResultItem) => {
      if (item.type === 'city') {
        onSelect(`${item.city.name}, ${item.country.name}`);
      } else {
        onSelect(item.country.name);
      }
      setQuery('');
      onClose();
    },
    [onSelect, onClose],
  );

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  const renderItem = useCallback(
    ({ item }: { item: ResultItem }) => (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: border }]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <AppText style={[styles.flag]}>{item.type === 'city' ? item.country.flag : item.country.flag}</AppText>
        <View style={styles.rowText}>
          <AppText style={[styles.primary, { color: textColor }]} numberOfLines={1}>
            {item.type === 'city' ? item.city.name : item.country.name}
          </AppText>
          {item.type === 'city' && (
            <AppText style={[styles.secondary, { color: secondary }]} numberOfLines={1}>
              {item.country.name}
            </AppText>
          )}
        </View>
      </TouchableOpacity>
    ),
    [border, textColor, secondary, handleSelect],
  );

  const keyExtractor = useCallback(
    (item: ResultItem, index: number) =>
      item.type === 'city'
        ? `c-${item.city.countryCode}-${item.city.stateCode}-${item.city.name}-${index}`
        : `co-${item.country.isoCode}`,
    [],
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {/* Dimmed backdrop — tap to close */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      {/* Sheet (70 % of screen) */}
      <View style={[styles.sheet, { backgroundColor: background }]}>
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: border }]} />
        </View>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: border }]}>
          <AppText style={[styles.title, { color: textColor }]}>Select Destination</AppText>
          <TouchableOpacity onPress={handleClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchWrap, { borderColor: border, backgroundColor: surface }]}>
          <Ionicons name="search" size={18} color={secondary} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search city or country..."
            placeholderTextColor={secondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Results */}
        {query.trim().length < 2 ? (
          <View style={styles.emptyWrap}>
            <AppText style={[styles.emptyText, { color: secondary }]}>
              Type at least 2 characters to search
            </AppText>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyWrap}>
            <AppText style={[styles.emptyText, { color: secondary }]}>No results found</AppText>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    height: SCREEN_HEIGHT * 0.7,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    overflow: 'hidden',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    ...typography.lg,
    fontWeight: '600',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    height: 40,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.sm,
    padding: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  list: {
    paddingBottom: spacing['2xl'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  flag: {
    fontSize: 22,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  primary: {
    ...typography.sm,
    fontWeight: '500',
  },
  secondary: {
    ...typography.xs,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.sm,
  },
});
