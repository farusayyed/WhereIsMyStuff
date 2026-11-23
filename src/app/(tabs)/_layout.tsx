import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import type { ColorValue } from 'react-native';

import { colors } from '@/theme';

type TabIconProps = {
  symbol: string;
  color: ColorValue;
};

function TabIcon({ symbol, color }: TabIconProps) {
  return <Text style={[styles.icon, { color }]}>{symbol}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.bar,
        tabBarLabelPosition: 'below-icon',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon symbol="⌂" color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color }) => <TabIcon symbol="▦" color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color }) => <TabIcon symbol="★" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Item',
          tabBarIcon: ({ color }) => <TabIcon symbol="+" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon symbol="⚙" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
});
