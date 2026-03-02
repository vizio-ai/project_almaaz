import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, useThemeColor, typography, spacing, radii } from '@shared/ui-kit';
import type { TravelInfo, TravelInfoType } from '../../domain/entities/TravelInfo';
import type {
  AddTravelInfoParams,
  UpdateTravelInfoParams,
} from '../../domain/repository/ManualItineraryRepository';

const TYPE_OPTIONS: { label: string; value: TravelInfoType; icon: 'airplane-outline' | 'bed-outline' | 'car-outline' | 'document-text-outline' }[] = [
  { label: 'Flight', value: 'flight', icon: 'airplane-outline' },
  { label: 'Hotel', value: 'hotel', icon: 'bed-outline' },
  { label: 'Rental Car', value: 'rental_car', icon: 'car-outline' },
  { label: 'Other', value: 'other', icon: 'document-text-outline' },
];

export interface TravelInfoFormModalProps {
  visible: boolean;
  editingItem: TravelInfo | null;
  onAdd: (params: AddTravelInfoParams) => Promise<unknown>;
  onUpdate: (id: string, params: UpdateTravelInfoParams) => Promise<unknown>;
  onRemove: (id: string) => Promise<unknown>;
  onClose: () => void;
}

export function TravelInfoFormModal({
  visible,
  editingItem,
  onAdd,
  onUpdate,
  onRemove,
  onClose,
}: TravelInfoFormModalProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const accent = useThemeColor('accent');

  const [type, setType] = useState<TravelInfoType>('flight');
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editingItem) {
      setType(editingItem.type);
      setTitle(editingItem.title);
      setProvider(editingItem.provider ?? '');
      setDetail(editingItem.detail ?? '');
    } else {
      setType('flight');
      setTitle('');
      setProvider('');
      setDetail('');
    }
    setBusy(false);
  }, [visible, editingItem]);

  const handleSave = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const params = {
        type,
        title: title.trim(),
        provider: provider.trim() || null,
        detail: detail.trim() || null,
      };
      if (editingItem) {
        await onUpdate(editingItem.id, params);
      } else {
        await onAdd(params);
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!editingItem || busy) return;
    setBusy(true);
    try {
      await onRemove(editingItem.id);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const canSave = title.trim().length > 0 && !busy;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.scrimTouchable} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: surface }]}>
          {/* Drag handle */}
          <View style={[styles.handle, { backgroundColor: border }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: border }]}>
            <AppText style={[styles.headerTitle, { color: textColor }]}>
              {editingItem ? 'Edit Travel Info' : 'Add Travel Info'}
            </AppText>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Type chips */}
            <View style={styles.typeRow}>
              {TYPE_OPTIONS.map((t) => {
                const isSelected = type === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setType(t.value)}
                    style={[
                      styles.typeChip,
                      { borderColor: border },
                      isSelected && { backgroundColor: accent, borderColor: accent },
                    ]}
                  >
                    <Ionicons
                      name={t.icon}
                      size={14}
                      color={isSelected ? '#fff' : secondary}
                    />
                    <AppText
                      style={[styles.typeLabel, { color: isSelected ? '#fff' : secondary }]}
                    >
                      {t.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Fields */}
            <FieldInput
              label="Title *"
              value={title}
              onChangeText={setTitle}
              placeholder={
                type === 'flight'
                  ? 'e.g. Istanbul → London'
                  : type === 'hotel'
                  ? 'e.g. Hotel Name'
                  : type === 'rental_car'
                  ? 'e.g. Car pickup'
                  : 'e.g. Train ticket'
              }
              textColor={textColor}
              secondary={secondary}
              border={border}
            />
            <FieldInput
              label="Provider"
              value={provider}
              onChangeText={setProvider}
              placeholder={
                type === 'flight'
                  ? 'e.g. Turkish Airlines'
                  : type === 'hotel'
                  ? 'e.g. Marriott'
                  : type === 'rental_car'
                  ? 'e.g. Hertz'
                  : 'e.g. Eurostar'
              }
              textColor={textColor}
              secondary={secondary}
              border={border}
            />
            <FieldInput
              label="Reference / Detail"
              value={detail}
              onChangeText={setDetail}
              placeholder="e.g. Booking ref: ABC123"
              textColor={textColor}
              secondary={secondary}
              border={border}
            />

            {/* Actions */}
            <View style={styles.actions}>
              {editingItem && (
                <TouchableOpacity
                  onPress={handleRemove}
                  disabled={busy}
                  style={[styles.deleteBtn, { borderColor: '#EF4444' }]}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSave}
                disabled={!canSave}
                style={[
                  styles.saveBtn,
                  { backgroundColor: accent },
                  !canSave && styles.saveBtnDisabled,
                ]}
              >
                <AppText style={styles.saveBtnLabel}>
                  {editingItem ? 'Update' : 'Add'}
                </AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Internal field component ─────────────────────────────────────────────────

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  textColor,
  secondary,
  border,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  textColor: string;
  secondary: string;
  border: string;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <AppText style={[fieldStyles.label, { color: secondary }]}>{label}</AppText>
      <TextInput
        style={[fieldStyles.input, { color: textColor, borderColor: border }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={secondary}
        returnKeyType="next"
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.caption, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    ...typography.sm,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrimTouchable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.xl,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    marginBottom: spacing.lg,
  },
  headerTitle: { ...typography.base, fontWeight: typography.weights.semibold },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  typeLabel: { ...typography.caption },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  deleteBtn: {
    width: 46,
    height: 46,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flex: 1,
    height: 46,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnLabel: {
    ...typography.base,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },
});
