import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography, spacing, radii } from '../theme';
import { CustomSwitch } from './CustomSwitch';

const POPOVER_GAP = 8;
const POPOVER_WIDTH = 199;
const POPOVER_EST_HEIGHT = 80;

export interface ToggleRowProps {
  /** Label shown next to the switch. */
  label: string;
  /** Controlled switch value. */
  value: boolean;
  /** Called when the user toggles the switch. */
  onValueChange: (value: boolean) => void;
  /** Optional: when set, an info icon is shown. Tapping it shows a popover with this message. */
  infoMessage?: string | null;
  /** @deprecated Not shown; kept for API compatibility. */
  infoTitle?: string | null;
}

export function ToggleRow({
  label,
  value,
  onValueChange,
  infoMessage,
}: ToggleRowProps) {
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [iconLayout, setIconLayout] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const iconRef = useRef<View>(null);
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');

  const openPopover = () => {
    if (!infoMessage?.trim()) return;
    iconRef.current?.measureInWindow((x, y, w, h) => {
      setIconLayout({ x, y, w, h });
      setPopoverVisible(true);
    });
  };

  const closePopover = () => setPopoverVisible(false);

  const showInfoIcon = Boolean(infoMessage?.trim());
  const window = Dimensions.get('window');
  const popoverLeft = iconLayout
    ? Math.max(12, Math.min(window.width - POPOVER_WIDTH - 12, iconLayout.x + iconLayout.w / 2 - POPOVER_WIDTH / 2))
    : 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <CustomSwitch
          value={value}
          onValueChange={onValueChange}
          trackColorOff={border}
          trackColorOn={textColor}
          thumbColor="#fff"
        />
        <View style={styles.labelWrap}>
          <AppText style={[styles.label, { color: textColor }]}>{label}</AppText>
          {showInfoIcon && (
            <View ref={iconRef} collapsable={false}>
              <TouchableOpacity
                onPress={openPopover}
                hitSlop={8}
                accessibilityLabel="More info"
                accessibilityRole="button"
              >
                <Ionicons name="information-circle-outline" size={16} color={secondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <Modal
        visible={popoverVisible && Boolean(infoMessage?.trim())}
        transparent
        animationType="fade"
        onRequestClose={closePopover}
      >
        <TouchableWithoutFeedback onPress={closePopover}>
          <View style={styles.modalOverlay}>
            {iconLayout && (
              <View
                style={[
                  styles.popover,
                  {
                    borderColor: border,
                    backgroundColor: surface,
                    top: iconLayout.y - POPOVER_GAP - POPOVER_EST_HEIGHT,
                    left: popoverLeft,
                    width: POPOVER_WIDTH,
                    ...Platform.select({
                      ios: {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                      },
                      android: { elevation: 4 },
                    }),
                  },
                ]}
                onStartShouldSetResponder={() => true}
              >
                <AppText style={[styles.popoverMessage, { color: secondary }]}>
                  {infoMessage?.trim()}
                </AppText>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 0,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: typography.weights.regular,
    lineHeight: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  popover: {
    position: 'absolute',
    padding: 12,
    width: POPOVER_WIDTH,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  popoverMessage: {
    ...typography.sm,
    fontWeight: typography.weights.regular,
    lineHeight: 20,
  },
});
