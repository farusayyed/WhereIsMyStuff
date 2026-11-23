import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { useInventory } from '@/context/InventoryContext';
import { formatLocationPath } from '@/lib/locations';
import { colors, radius } from '@/theme';

type LocationSelectorProps = {
  selectedLocationId: string | null;
  onSelect: (locationId: string) => void;
  error?: string;
};

export function LocationSelector({
  selectedLocationId,
  onSelect,
  error,
}: LocationSelectorProps) {
  const { locations, addLocation, isSaving } = useInventory();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [room, setRoom] = useState('');
  const [place, setPlace] = useState('');
  const [spot, setSpot] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  async function createLocation() {
    if (!room.trim()) {
      setFormError('Enter a room name, for example Bedroom.');
      return;
    }

    try {
      setFormError(null);
      const created = await addLocation({ room, place, spot });
      onSelect(created.id);
      setRoom('');
      setPlace('');
      setSpot('');
      setShowCreateForm(false);
    } catch (caughtError) {
      setFormError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not save that storage location.',
      );
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Storage location</Text>
      <Text style={styles.hint}>
        Choose a saved place, or create one like Bedroom → Wardrobe → Top Drawer.
      </Text>

      {locations.length === 0 && !showCreateForm ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No saved locations yet.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {locations.map((location) => {
            const selected = location.id === selectedLocationId;
            return (
              <Pressable
                key={location.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelect(location.id)}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {formatLocationPath(location)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {showCreateForm ? (
        <View style={styles.createCard}>
          <Text style={styles.createTitle}>New storage location</Text>
          <TextField
            label="Room"
            value={room}
            onChangeText={(value) => {
              setRoom(value);
              setFormError(null);
            }}
            placeholder="Bedroom"
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
          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          <PrimaryButton
            label={isSaving ? 'Saving…' : 'Save location'}
            disabled={isSaving}
            onPress={() => {
              if (!isSaving) {
                void createLocation();
              }
            }}
          />
          <PrimaryButton
            label="Cancel"
            variant="secondary"
            disabled={isSaving}
            onPress={() => {
              setShowCreateForm(false);
              setFormError(null);
            }}
          />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowCreateForm(true)}
          style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
        >
          <Text style={styles.createButtonLabel}>+ Create new location</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  list: {
    gap: 8,
  },
  option: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionText: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: colors.primaryDark,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
  },
  createButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  createButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  pressed: {
    opacity: 0.8,
  },
  createCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  createTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
});
