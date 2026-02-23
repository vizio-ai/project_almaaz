import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, useThemeColor } from '@shared/ui-kit';
import { COUNTRIES, type Country } from '../../data/config/countries';
import { AuthStrings } from '../constants/strings';

interface CountryPickerProps {
  selectedCountry: Country;
  onSelect: (country: Country) => void;
}

export function CountryPicker({ selectedCountry, onSelect }: CountryPickerProps) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const bgColor = useThemeColor('background');
  const surfaceColor = useThemeColor('surface');
  const textColor = useThemeColor('labelText');
  const secondaryText = useThemeColor('textSecondary');
  const borderColor = useThemeColor('border');
  const borderLight = useThemeColor('borderLight');
  const placeholderColor = useThemeColor('placeholder');
  const accentColor = useThemeColor('accent');
  const selectedBg = useThemeColor('selectedBg');

  const filteredCountries = search.trim()
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dialCode.includes(search),
      )
    : COUNTRIES;

  const handleOpen = () => {
    setSearch('');
    setVisible(true);
  };

  const handleSelect = (country: Country) => {
    onSelect(country);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, { borderColor, backgroundColor: bgColor }]}
        onPress={handleOpen}
        activeOpacity={0.7}
      >
        <AppText style={[styles.dialCode, { color: textColor }]}>
          {selectedCountry.dialCode}
        </AppText>
        <Ionicons name="chevron-down" size={16} color={secondaryText} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={[styles.modal, { backgroundColor: bgColor }]}>
          <View style={[styles.header, { borderBottomColor: borderLight }]}>
            <AppText style={[styles.headerTitle, { color: textColor }]}>
              {AuthStrings.phoneEntry.countryPickerTitle}
            </AppText>
            <TouchableOpacity onPress={() => setVisible(false)} activeOpacity={0.7}>
              <AppText style={[styles.headerClose, { color: accentColor }]}>
                {AuthStrings.phoneEntry.countryPickerClose}
              </AppText>
            </TouchableOpacity>
          </View>

          <View style={[styles.searchRow, { borderBottomColor: borderLight }]}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: surfaceColor, color: textColor }]}
              value={search}
              onChangeText={setSearch}
              placeholder={AuthStrings.phoneEntry.countrySearchPlaceholder}
              placeholderTextColor={placeholderColor}
              autoFocus
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item, index) => `${item.dialCode}-${index}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected =
                item.dialCode === selectedCountry.dialCode &&
                item.name === selectedCountry.name;
              return (
                <TouchableOpacity
                  style={[
                    styles.row,
                    { borderBottomColor: borderLight },
                    isSelected && { backgroundColor: selectedBg },
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <AppText style={[styles.rowName, { color: textColor }]}>{item.name}</AppText>
                  <AppText style={[styles.rowCode, { color: secondaryText }]}>{item.dialCode}</AppText>
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 78,
    height: 36,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 6,
  },
  dialCode: { fontSize: 14, fontWeight: '400' },
  modal: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerClose: { fontSize: 15, fontWeight: '600' },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchInput: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowName: { flex: 1, fontSize: 15 },
  rowCode: { fontSize: 14, fontWeight: '500' },
});
