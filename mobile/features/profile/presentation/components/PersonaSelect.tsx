import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, useThemeColor } from '@shared/ui-kit';

export interface PersonaOption {
  value: string;
  label: string;
}

interface PersonaSelectProps {
  label: string;
  value: string | null;
  options: readonly PersonaOption[];
  onSelect: (value: string | null) => void;
  placeholder?: string;
}

export function PersonaSelect({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select...',
}: PersonaSelectProps) {
  const [visible, setVisible] = useState(false);
  const textColor = useThemeColor('text');
  const bgColor = useThemeColor('background');
  const borderColor = useThemeColor('border');
  const secondaryText = useThemeColor('textSecondary');
  const accentColor = useThemeColor('accent');
  const selectedBg = useThemeColor('selectedBg');

  const displayValue = value
    ? options.find((o) => o.value === value)?.label ?? value
    : '';

  const handleSelect = (opt: PersonaOption) => {
    onSelect(opt.value);
    setVisible(false);
  };

  const handleClear = () => {
    onSelect(null);
    setVisible(false);
  };

  return (
    <>
      <View style={styles.field}>
        <AppText style={[styles.label, { color: textColor }]}>{label}</AppText>
        <TouchableOpacity
          style={[styles.trigger, { borderColor, backgroundColor: bgColor }]}
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
        >
          <AppText
            style={[styles.triggerText, { color: displayValue ? textColor : secondaryText }]}
            numberOfLines={1}
          >
            {displayValue || placeholder}
          </AppText>
          <Ionicons name="chevron-down" size={18} color={secondaryText} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={[styles.modal, { backgroundColor: bgColor }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <AppText style={[styles.modalTitle, { color: textColor }]}>{label}</AppText>
            <TouchableOpacity onPress={() => setVisible(false)} activeOpacity={0.7}>
              <AppText style={[styles.modalClose, { color: accentColor }]}>Done</AppText>
            </TouchableOpacity>
          </View>
          <FlatList
            data={[...options]}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => {
              const isSelected = value === item.value;
              return (
                <TouchableOpacity
                  style={[
                    styles.optionRow,
                    { borderBottomColor: borderColor },
                    isSelected && { backgroundColor: selectedBg },
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <AppText style={[styles.optionLabel, { color: textColor }]}>{item.label}</AppText>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color={accentColor} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
          {value && (
            <TouchableOpacity
              style={[styles.clearBtn, { borderTopColor: borderColor }]}
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <AppText style={[styles.clearText, { color: secondaryText }]}>Clear selection</AppText>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

interface PersonaMultiSelectProps {
  label: string;
  value: string[];
  options: readonly PersonaOption[];
  onSelect: (value: string[]) => void;
  placeholder?: string;
}

export function PersonaMultiSelect({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select...',
}: PersonaMultiSelectProps) {
  const [visible, setVisible] = useState(false);
  const textColor = useThemeColor('text');
  const bgColor = useThemeColor('background');
  const borderColor = useThemeColor('border');
  const secondaryText = useThemeColor('textSecondary');
  const accentColor = useThemeColor('accent');
  const selectedBg = useThemeColor('selectedBg');

  const displayValue =
    value?.length > 0
      ? value
          .map((v) => options.find((o) => o.value === v)?.label ?? v)
          .join(', ')
      : '';

  const toggle = (opt: PersonaOption) => {
    const has = value.includes(opt.value);
    if (has) {
      onSelect(value.filter((v) => v !== opt.value));
    } else {
      onSelect([...value, opt.value]);
    }
  };

  return (
    <>
      <View style={styles.field}>
        <AppText style={[styles.label, { color: textColor }]}>{label}</AppText>
        <TouchableOpacity
          style={[styles.trigger, { borderColor, backgroundColor: bgColor }]}
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
        >
          <AppText
            style={[styles.triggerText, { color: displayValue ? textColor : secondaryText }]}
            numberOfLines={1}
          >
            {displayValue || placeholder}
          </AppText>
          <Ionicons name="chevron-down" size={18} color={secondaryText} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={[styles.modal, { backgroundColor: bgColor }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <AppText style={[styles.modalTitle, { color: textColor }]}>{label}</AppText>
            <TouchableOpacity onPress={() => setVisible(false)} activeOpacity={0.7}>
              <AppText style={[styles.modalClose, { color: accentColor }]}>Done</AppText>
            </TouchableOpacity>
          </View>
          <FlatList
            data={[...options]}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => {
              const isSelected = value.includes(item.value);
              return (
                <TouchableOpacity
                  style={[
                    styles.optionRow,
                    { borderBottomColor: borderColor },
                    isSelected && { backgroundColor: selectedBg },
                  ]}
                  onPress={() => toggle(item)}
                  activeOpacity={0.7}
                >
                  <AppText style={[styles.optionLabel, { color: textColor }]}>{item.label}</AppText>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color={accentColor} />
                  )}
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
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 6,
  },
  triggerText: { fontSize: 14, flex: 1 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalClose: { fontSize: 15, fontWeight: '600' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  optionLabel: { fontSize: 15, flex: 1 },
  clearBtn: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  clearText: { fontSize: 12 },
});
