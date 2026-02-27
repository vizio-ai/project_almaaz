import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';

import HomeSvg from '../../../../../assets/images/home.svg';
import BookmarkSvg from '../../../../../assets/images/bookmark.svg';
import CreateSvg from '../../../../../assets/images/create.svg';
import DiscoverySvg from '../../../../../assets/images/discovery.svg';
import ProfileSvg from '../../../../../assets/images/profile.svg';

const TAB_BAR_BG = '#0A0A0A';
const ICON_WHITE = '#FFFFFF';

type SvgIcon = React.FC<{ width?: number; height?: number; fill?: string; color?: string }>;

const TABS: { Icon: SvgIcon; label: string }[] = [
  { Icon: HomeSvg,      label: 'Home'    },
  { Icon: BookmarkSvg,  label: 'Trips'   },
  { Icon: CreateSvg,    label: ''        },
  { Icon: DiscoverySvg, label: 'Discover'},
  { Icon: ProfileSvg,   label: 'Profile' },
];

interface BottomBarProps {
  onTabPress: () => void;
}

const ACCENT = '#44FFFF';

export function BottomBar({ onTabPress }: BottomBarProps) {
  const [pressedIndex, setPressedIndex] = useState<number>(-1);

  const getIconColor = (index: number) => {
    if (pressedIndex === index) return ACCENT;
    if (index === 0 && pressedIndex > 0) return ICON_WHITE;
    return index === 0 ? ACCENT : ICON_WHITE;
  };

  return (
    <View style={[styles.tabBar, { paddingBottom: Platform.OS === 'ios' ? 20 : 8 }]}>
      {TABS.map((tab, i) => {
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
              return <tab.Icon width={20} height={20} color={iconColor} />;
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
    paddingTop: 6,
    paddingHorizontal: 24,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#44FFFF',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
