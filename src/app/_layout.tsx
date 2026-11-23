import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { InventoryProvider } from '@/context/InventoryContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <InventoryProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="category/[id]" />
          <Stack.Screen name="item/[id]" />
          <Stack.Screen name="item/edit/[id]" />
          <Stack.Screen name="locations/index" />
          <Stack.Screen name="locations/new" />
          <Stack.Screen name="locations/edit/[id]" />
        </Stack>
      </InventoryProvider>
    </SafeAreaProvider>
  );
}
