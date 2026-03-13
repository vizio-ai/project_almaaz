import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { radii, colors } from '../theme';
import HomeSvg from '../../../assets/images/home.svg';
import BookmarkSvg from '../../../assets/images/bookmark.svg';
import CreateSvg from '../../../assets/images/create.svg';
import DiscoverySvg from '../../../assets/images/discovery.svg';
import ProfileSvg from '../../../assets/images/profile.svg';

export type TabKey = 'index' | 'my-trips' | 'create' | 'discover' | 'profile';

type SvgIcon = React.FC<{ width?: number; height?: number; fill?: string; color?: string }>;

interface TabDefinition {
  key: TabKey;
  label: string;
  Icon: SvgIcon;
}

const TABS: TabDefinition[] = [
  { key: 'index',    label: 'Home',     Icon: HomeSvg      },
  { key: 'my-trips', label: 'My Trips', Icon: BookmarkSvg  },
  { key: 'create',   label: 'Create',   Icon: CreateSvg    },
  { key: 'discover', label: 'Discover', Icon: DiscoverySvg },
  { key: 'profile',  label: 'Profile',  Icon: ProfileSvg   },
];

const c = colors.light;

interface AppTabBarProps {
  activeKey: TabKey;
  onPress: (key: TabKey) => void;
}

export function AppTabBar({ activeKey, onPress }: AppTabBarProps) {
  const inactive = useThemeColor('icon');
  const active = useThemeColor('borderColor');

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const focused = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.item}
            activeOpacity={0.7}
            onPress={() => onPress(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: focused }}
          >
            <tab.Icon width={20} height={20} color={focused ? active : inactive} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 76,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 6,
    backgroundColor: c.headerBg,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    borderTopWidth: 1,
    borderTopColor: c.borderColor,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
