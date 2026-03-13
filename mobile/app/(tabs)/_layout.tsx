import React, { useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { FileClock, PencilLine, Sparkles } from 'lucide-react-native';
import { AppTabBar, AppText, type TabKey } from '@shared/ui-kit';
import { ManualItineraryProvider } from '@shared/manual-itinerary';
import { createManualItineraryRepository } from '@/infrastructure/manual-itinerary';

const manualItineraryRepository = createManualItineraryRepository();

type LucideIcon = React.FC<{ size?: number; color?: string }>;

const CREATE_OPTIONS: { key: string; Icon: LucideIcon; label: string; route: string }[] = [
  {
    key: 'import',
    Icon: FileClock,
    label: 'Import your trip plan',
    route: '/(tabs)/create?mode=import',
  },
  {
    key: 'manual',
    Icon: PencilLine,
    label: 'Build plan yourself',
    route: '/itinerary/new',
  },
  {
    key: 'agent',
    Icon: Sparkles,
    label: 'Plan with your agent',
    route: '/(tabs)/create',
  },
];

export default function TabsLayout() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <ManualItineraryProvider manualItineraryRepository={manualItineraryRepository}>
      <Tabs
        tabBar={(props) => {
          const activeKey = props.state.routes[props.state.index].name as TabKey;
          return (
            <View style={{ backgroundColor: '#FFFFFF' }}>
              <AppTabBar
                activeKey={activeKey}
                onPress={(key) => {
                  if (key === 'create') {
                    setShowCreateModal(true);
                  } else {
                    props.navigation.navigate(key);
                  }
                }}
              />
            </View>
          );
        }}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="my-trips" />
        <Tabs.Screen name="create" />
        <Tabs.Screen name="discover" />
        <Tabs.Screen name="profile" />
      </Tabs>

      {showCreateModal && (
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={styles.scrim}
            activeOpacity={1}
            onPress={() => setShowCreateModal(false)}
          >
            <TouchableOpacity activeOpacity={1} style={styles.optionsContainer} onPress={() => {}}>
              {CREATE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.frame, styles.navFlexBox]}
                  activeOpacity={0.75}
                  onPress={() => {
                    setShowCreateModal(false);
                    router.navigate(option.route as Parameters<typeof router.navigate>[0]);
                  }}
                >
                  <View style={[styles.blocksNavNavItem1, styles.navFlexBox]}>
                    <option.Icon size={20} color="#FFFFFF" />
                  </View>
                  <AppText style={styles.optionLabel}>{option.label}</AppText>
                </TouchableOpacity>
              ))}
            </TouchableOpacity>
          </TouchableOpacity>
        </BlurView>
      )}
    </ManualItineraryProvider>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 48,
    paddingBottom: 96,
  },
  optionsContainer: {
    gap: 11,
    alignItems: 'center',
    width: '100%',
  },
  navFlexBox: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  frame: {
    width: '100%',
    height: 48,
    elevation: 6,
    borderRadius: 8,
    backgroundColor: '#0A0A0A',
    paddingLeft: 8,
    paddingRight: 16,
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  blocksNavNavItem1: {
    height: 32,
    width: 32,
    borderRadius: 9999,
  },
  optionLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
});
