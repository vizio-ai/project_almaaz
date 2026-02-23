import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@shared/ui-kit';

const TAB_BAR_BG = '#0A0A0A';
const ICON_WHITE = '#FFFFFF';

const TABS = [
  { icon: 'home' as const, label: 'Home' },
  { icon: 'bookmark-outline' as const, label: 'Trips' },
  { icon: 'add' as const, label: '' },
  { icon: 'compass-outline' as const, label: 'Discover' },
  { icon: 'person-outline' as const, label: 'Profile' },
];

interface BottomBarProps {
  onTabPress: () => void;
}

export function BottomBar({ onTabPress }: BottomBarProps) {
  const accent = useThemeColor('accent');
  const [pressedIndex, setPressedIndex] = useState<number>(-1);

  const getIconColor = (index: number) => {
    if (pressedIndex === index) return accent;
    if (index === 0 && pressedIndex > 0) return ICON_WHITE;
    return index === 0 ? accent : ICON_WHITE;
  };

  return (
    <View style={[styles.tabBar, { paddingBottom: Platform.OS === 'ios' ? 20 : 8 }]}>
      {TABS.map((tab, i) => {
        const isAdd = tab.icon === 'add';
        return (
          <Pressable
            key={i}
            style={styles.tabItem}
            onPressIn={() => setPressedIndex(i)}
            onPressOut={() => setPressedIndex(-1)}
            onPress={onTabPress}
            accessibilityRole="button"
            accessibilityLabel={`${tab.label || 'Create'} - Sign up to continue`}
          >
            {() => {
              const iconColor = getIconColor(i);
              return isAdd ? (
                <Ionicons name="add" size={24} color={iconColor} />
              ) : (
                <Ionicons name={tab.icon} size={22} color={iconColor} />
              );
            }}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 76,
    backgroundColor: TAB_BAR_BG,
    borderTopWidth: 0,
    paddingTop: 6,
    paddingHorizontal: 24,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
