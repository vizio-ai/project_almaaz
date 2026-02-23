import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@shared/ui-kit';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const TAB_BAR_BG = '#0A0A0A';

function TabIcon({
  name,
  focused,
  activeColor,
  inactiveColor,
}: {
  name: IoniconsName;
  focused: boolean;
  activeColor: string;
  inactiveColor: string;
}) {
  const color = focused ? activeColor : inactiveColor;
  return (
    <View style={icon.wrap}>
      <Ionicons name={name} size={24} color={color} />
    </View>
  );
}

const icon = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
});

export default function TabsLayout() {
  const accent = useThemeColor('accent');
  const inactive = useThemeColor('icon');

  const tabProps = { activeColor: accent, inactiveColor: inactive };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: TAB_BAR_BG,
          borderTopWidth: 0,
          height: 76,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        },
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: inactive,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} {...tabProps} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-trips"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'bookmark' : 'bookmark-outline'} focused={focused} {...tabProps} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="add" focused={focused} {...tabProps} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'compass' : 'compass-outline'} focused={focused} {...tabProps} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} {...tabProps} />
          ),
        }}
      />
    </Tabs>
  );
}
