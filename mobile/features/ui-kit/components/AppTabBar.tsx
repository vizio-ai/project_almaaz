import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import HomeSvg from '../../../assets/images/home.svg';
import BookmarkSvg from '../../../assets/images/bookmark.svg';
import CreateSvg from '../../../assets/images/create.svg';
import DiscoverySvg from '../../../assets/images/discovery.svg';
import ProfileSvg from '../../../assets/images/profile.svg';

export type TabKey = 'index' | 'my-trips' | 'create' | 'discover' | 'profile';

type SvgIcon = React.FC<{ width?: number; height?: number; fill?: string; color?: string }>;

interface TabDefinition {
  key: TabKey;
  Icon: SvgIcon;
}

const TABS: TabDefinition[] = [
  { key: 'index',    Icon: HomeSvg      },
  { key: 'my-trips', Icon: BookmarkSvg  },
  { key: 'create',   Icon: CreateSvg    },
  { key: 'discover', Icon: DiscoverySvg },
  { key: 'profile',  Icon: ProfileSvg   },
];

interface AppTabBarProps {
  activeKey: TabKey;
  onPress: (key: TabKey) => void;
}

export function AppTabBar({ activeKey, onPress }: AppTabBarProps) {
  const inactive = useThemeColor('icon');

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
          >
            <tab.Icon width={20} height={20} color={focused ? '#44FFFF' : inactive} />
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
    backgroundColor: '#0A0A0A',
    flexDirection: 'row',
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#44FFFF',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
