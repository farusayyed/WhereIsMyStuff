import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors, radius } from '@/theme';

const appVersion = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>About</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Where Is My Stuff? is a simple home inventory you can use without an account.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/locations')}
        style={({ pressed }) => [styles.card, styles.linkCard, pressed && styles.pressed]}
      >
        <Text style={styles.cardTitle}>Storage Locations</Text>
        <Text style={styles.body}>
          Create reusable places such as Bedroom → Wardrobe → Top Drawer, then assign them when you
          add or edit items.
        </Text>
        <Text style={styles.linkLabel}>Manage locations ›</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>App information</Text>
        <InfoRow label="Name" value="Where Is My Stuff?" />
        <InfoRow label="Version" value={appVersion} />
        <Text style={styles.body}>
          Keep a private note of household items and the place you stored each one. Search, browse
          by category, and add new items from the tabs below.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Offline mode</Text>
        <Text style={styles.body}>
          This app does not use an account, a server, or the internet. Nothing you type is sent
          anywhere.
        </Text>
        <Text style={styles.body}>
          Your inventory, storage locations, and optional item photos are saved only on this phone
          or tablet. Photos are copied into the app’s private storage and never uploaded. Sample
          items are added once on first setup and are not recreated after you delete them.
        </Text>
      </View>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  linkCard: {
    gap: 8,
  },
  pressed: {
    opacity: 0.88,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    fontSize: 15,
    color: colors.textMuted,
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
