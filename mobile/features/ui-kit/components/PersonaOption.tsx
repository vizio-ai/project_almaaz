import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography, radii, colors } from '../theme';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

/** SVG component from require('*.svg') - accepts width, height, stroke for color */
type SvgComponent = React.ComponentType<{
  width?: number;
  height?: number;
  color?: string;
  stroke?: string;
}>;

interface PersonaOptionProps {
  label: string;
  /** Ionicons name. Use iconSource for custom assets. */
  icon?: IoniconsName;
  /** Custom icon (e.g. from require('@/assets/images/icon.svg')) */
  iconSource?: SvgComponent;
  isSelected: boolean;
  onPress: () => void;
}

const OPTION_HEIGHT = 40;
const BORDER_COLOR = '#E4E4E7';
const TEXT_COLOR = colors.light.labelText;

const ICON_SIZE = 18;

export function PersonaOption({ label, icon, iconSource, isSelected, onPress }: PersonaOptionProps) {
  const buttonPrimary = useThemeColor('buttonPrimary');
  const buttonPrimaryText = useThemeColor('buttonPrimaryText');
  const iconColor = isSelected ? buttonPrimaryText : TEXT_COLOR;
  const IconComponent = iconSource;

  return (
    <TouchableOpacity
      style={[
        styles.option,
        { borderColor: isSelected ? buttonPrimary : BORDER_COLOR },
        isSelected && { backgroundColor: buttonPrimary },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {IconComponent && (
        <View style={styles.icon}>
          <IconComponent
            width={ICON_SIZE}
            height={ICON_SIZE}
            color={iconColor}
            stroke={iconColor}
          />
        </View>
      )}
      {!iconSource && icon && (
        <Ionicons
          name={icon}
          size={ICON_SIZE}
          color={iconColor}
          style={styles.icon}
        />
      )}
      <AppText
        style={[
          styles.label,
          { color: isSelected ? buttonPrimaryText : TEXT_COLOR },
        ]}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: OPTION_HEIGHT,
    height: OPTION_HEIGHT,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 10,
  },
  label: { ...typography.sm, fontWeight: typography.weights.regular, flex: 1 },
});
