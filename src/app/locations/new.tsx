import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DatabaseState } from '@/components/DatabaseState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useInventory } from '@/context/InventoryContext';
import { colors, radius } from '@/theme';

export default function NewLocationScreen() {
  const { status, error, isSaving, addLocation, retryInitialization } = useInventory();
  const [room, setRoom] = useState('');
  const [place, setPlace] = useState('');
  const [spot, setSpot] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | undefined>();

  async function saveLocation() {
    if (!room.trim()) {
      setRoomError('Enter a room name.');
      return;
    }

    try {
      setRoomError(undefined);
      setFormError(null);
      await addLocation({ room, place, spot });
      router.back();
    } catch (caughtError) {
      setFormError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not save that storage location.',
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
        <Text style={styles.eyebrow}>New</Text>
        <Text style={styles.title}>Add Location</Text>
        <Text style={styles.subtitle}>
          Room is required. Storage place and specific spot are optional.
        </Text>
      </View>

      {status === 'loading' ? (
        <DatabaseState
          isLoading
          title="Preparing storage"
          message="The local database needs to finish opening before you can save locations."
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

      {status === 'ready' ? (
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
              <Text style={styles.failureTitle}>Could not save location</Text>
              <Text style={styles.failureBody}>{formError}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label={isSaving ? 'Saving…' : 'Save location'}
            disabled={isSaving}
            onPress={() => {
              if (!isSaving) {
                void saveLocation();
              }
            }}
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
