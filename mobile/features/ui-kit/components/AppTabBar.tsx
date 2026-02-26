import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';

export type TabKey = 'index' | 'my-trips' | 'create' | 'discover' | 'profile';

interface TabDefinition {
  key: TabKey;
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
  inactiveIcon: React.ComponentProps<typeof Ionicons>['name'];
}

const TABS: TabDefinition[] = [
  { key: 'index',    activeIcon: 'home',     inactiveIcon: 'home-outline'     },
  { key: 'my-trips', activeIcon: 'bookmark', inactiveIcon: 'bookmark-outline' },
  { key: 'create',   activeIcon: 'add',      inactiveIcon: 'add'              },
  { key: 'discover', activeIcon: 'compass',  inactiveIcon: 'compass-outline'  },
  { key: 'profile',  activeIcon: 'person',   inactiveIcon: 'person-outline'   },
];

interface AppTabBarProps {
  activeKey: TabKey;
  onPress: (key: TabKey) => void;
}

export function AppTabBar({ activeKey, onPress }: AppTabBarProps) {
  const accent = useThemeColor('accent');
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
            <Ionicons
              name={focused ? tab.activeIcon : tab.inactiveIcon}
              size={24}
              color={focused ? accent : inactive}
            />
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
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
