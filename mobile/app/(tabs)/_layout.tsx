import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { AppTabBar, type TabKey } from '@shared/ui-kit';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => {
        const activeKey = props.state.routes[props.state.index].name as TabKey;
        return (
          <View style={{ backgroundColor: '#FFFFFF' }}>
            <AppTabBar
              activeKey={activeKey}
              onPress={(key) => props.navigation.navigate(key)}
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
  );
}
