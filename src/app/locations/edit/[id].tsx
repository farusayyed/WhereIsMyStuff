import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DatabaseState } from '@/components/DatabaseState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useInventory } from '@/context/InventoryContext';
import { colors, radius } from '@/theme';

export default function EditLocationScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const locationId = typeof params.id === 'string' ? params.id : '';
  const {
    status,
    error,
    isSaving,
    getLocation,
    updateLocation,
    retryInitialization,
  } = useInventory();
  const location = getLocation(locationId);

  const [room, setRoom] = useState('');
  const [place, setPlace] = useState('');
  const [spot, setSpot] = useState('');
  const [roomError, setRoomError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  useEffect(() => {
    if (!location || hydratedId === location.id) {
      return;
    }

    setRoom(location.room);
    setPlace(location.place);
    setSpot(location.spot);
    setHydratedId(location.id);
    setRoomError(undefined);
    setFormError(null);
  }, [location, hydratedId]);

  async function saveLocation() {
    if (!room.trim()) {
      setRoomError('Enter a room name.');
      return;
    }

    try {
      setRoomError(undefined);
      setFormError(null);
      await updateLocation(locationId, { room, place, spot });
      router.back();
    } catch (caughtError) {
      setFormError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not update that storage location.',
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
        <Text style={styles.eyebrow}>Edit</Text>
        <Text style={styles.title}>Edit Location</Text>
        <Text style={styles.subtitle}>
          Changes update this reusable location and the path shown on linked items.
        </Text>
      </View>

      {status === 'loading' ? (
        <DatabaseState
          isLoading
          title="Loading location"
          message="Reading this storage location from the local database."
        />
      ) : null}

      {status === 'error' ? (
        <DatabaseState
          title="Storage unavailable"
          message={error ?? 'The local database could not be opened.'}
          actionLabel="Try again"
          onAction={() => {
            void retryInitialization();
          }}
        />
      ) : null}

      {status === 'ready' && !location ? (
        <DatabaseState
          title="Location not found"
          message="This storage location may have been deleted."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      ) : null}

      {status === 'ready' && location ? (
        <>
          <TextField
            label="Room"
            value={room}
            onChangeText={(value) => {
              setRoom(value);
              setRoomError(undefined);
              setFormError(null);
            }}
            placeholder="Bedroom"
            error={roomError}
          />
          <TextField
            label="Storage place (optional)"
            value={place}
            onChangeText={(value) => {
              setPlace(value);
              setFormError(null);
            }}
            placeholder="Wardrobe"
          />
          <TextField
            label="Specific spot (optional)"
            value={spot}
            onChangeText={(value) => {
              setSpot(value);
              setFormError(null);
            }}
            placeholder="Top Drawer"
          />

          {formError ? (
            <View style={styles.failure}>
              <Text style={styles.failureTitle}>Could not save changes</Text>
              <Text style={styles.failureBody}>{formError}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label={isSaving ? 'Saving…' : 'Save changes'}
            disabled={isSaving}
            onPress={() => {
              if (!isSaving) {
                void saveLocation();
              }
            }}
          />
          <PrimaryButton
            label="Cancel"
            variant="secondary"
            disabled={isSaving}
            onPress={() => router.back()}
          />
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
