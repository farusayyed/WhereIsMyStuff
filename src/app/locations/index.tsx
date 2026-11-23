import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { DatabaseState } from '@/components/DatabaseState';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { useInventory } from '@/context/InventoryContext';
import { formatLocationPath } from '@/lib/locations';
import { colors, radius } from '@/theme';

export default function LocationsScreen() {
  const {
    locations,
    status,
    error,
    isSaving,
    deleteLocation,
    getLocationUsageCount,
    retryInitialization,
  } = useInventory();
  const [actionError, setActionError] = useState<string | null>(null);

  async function confirmDelete(locationId: string, label: string) {
    try {
      setActionError(null);
      const usageCount = await getLocationUsageCount(locationId);
      const message =
        usageCount > 0
          ? `“${label}” is used by ${usageCount} item${usageCount === 1 ? '' : 's'}. Those items will keep this path as text, but the reusable location will be removed.`
          : `“${label}” will be permanently removed from this device.`;

      Alert.alert('Delete location?', message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteLocation(locationId);
              } catch (deleteError) {
                setActionError(
                  deleteError instanceof Error
                    ? deleteError.message
                    : 'Could not delete that storage location.',
                );
              }
            })();
          },
        },
      ]);
    } catch (countError) {
      setActionError(
        countError instanceof Error
          ? countError.message
          : 'Could not check whether items use this location.',
      );
    }
  }

  return (
    <Screen>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={styles.back}
      >
        <Text style={styles.backLabel}>‹ Back</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.eyebrow}>Organize</Text>
        <Text style={styles.title}>Storage Locations</Text>
        <Text style={styles.subtitle}>
          Save reusable places like Bedroom → Wardrobe → Top Drawer and assign them to items.
        </Text>
      </View>

      {status === 'loading' ? (
        <DatabaseState
          isLoading
          title="Loading locations"
          message="Reading saved storage locations from the local database."
        />
      ) : null}

      {status === 'error' ? (
        <DatabaseState
          title="Could not load locations"
          message={error ?? 'The local database could not be opened.'}
          actionLabel="Try again"
          onAction={() => {
            void retryInitialization();
          }}
        />
      ) : null}

      {status === 'ready' ? (
        <>
          <PrimaryButton
            label="Add location"
            onPress={() => router.push('/locations/new')}
          />

          {actionError ? (
            <View style={styles.failure}>
              <Text style={styles.failureTitle}>Something went wrong</Text>
              <Text style={styles.failureBody}>{actionError}</Text>
            </View>
          ) : null}

          {locations.length === 0 ? (
            <EmptyState
              title="No saved locations yet"
              message="Create a room, optional storage place, and optional spot. You can reuse them when adding items."
              actionLabel="Add location"
              onAction={() => router.push('/locations/new')}
            />
          ) : (
            <View style={styles.list}>
              {locations.map((location) => {
                const label = formatLocationPath(location);
                return (
                  <View key={location.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{label}</Text>
                    <View style={styles.cardActions}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push(`/locations/edit/${location.id}`)}
                        style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
                      >
                        <Text style={styles.linkLabel}>Edit</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        disabled={isSaving}
                        onPress={() => {
                          void confirmDelete(location.id, label);
                        }}
                        style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
                      >
                        <Text style={styles.deleteLabel}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
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
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.text,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
  },
  linkButton: {
    paddingVertical: 2,
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  deleteLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },
  pressed: {
    opacity: 0.75,
  },
  failure: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.card,
    padding: 16,
    gap: 4,
  },
  failureTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.danger,
  },
  failureBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.danger,
  },
});
