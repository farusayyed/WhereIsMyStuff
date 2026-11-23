import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DatabaseState } from '@/components/DatabaseState';
import { LocationSelector } from '@/components/LocationSelector';
import { PhotoPickerField } from '@/components/PhotoPickerField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useInventory } from '@/context/InventoryContext';
import { categories } from '@/data/categories';
import { formatLocationPath } from '@/lib/locations';
import type { CategoryId, ItemImageChange } from '@/types/inventory';
import { colors, radius } from '@/theme';

type FormErrors = {
  name?: string;
  category?: string;
  location?: string;
};

export default function EditItemScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const itemId = typeof params.id === 'string' ? params.id : '';
  const {
    status,
    error,
    isSaving,
    getItem,
    getLocation,
    updateItem,
    retryInitialization,
  } = useInventory();
  const item = getItem(itemId);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [legacyLocation, setLegacyLocation] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [originalImageUri, setOriginalImageUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  useEffect(() => {
    if (!item || hydratedId === item.id) {
      return;
    }

    setName(item.name);
    setCategory(item.category);
    setSelectedLocationId(item.locationId);
    setLegacyLocation(item.locationId ? null : item.location);
    setNotes(item.notes);
    setPreviewUri(item.imageUri);
    setOriginalImageUri(item.imageUri);
    setHydratedId(item.id);
    setErrors({});
    setSaveError(null);
  }, [item, hydratedId]);

  function resolveImageChange(): ItemImageChange {
    if (previewUri === originalImageUri) {
      return { type: 'unchanged' };
    }

    if (!previewUri) {
      return { type: 'removed' };
    }

    if (previewUri !== originalImageUri) {
      return { type: 'new', sourceUri: previewUri };
    }

    return { type: 'unchanged' };
  }

  async function saveChanges() {
    const nextErrors: FormErrors = {};
    if (!name.trim()) {
      nextErrors.name = 'Enter a name for this item.';
    }
    if (!category) {
      nextErrors.category = 'Choose a category.';
    }
    if (!selectedLocationId && !legacyLocation?.trim()) {
      nextErrors.location = 'Choose or create a storage location.';
    }

    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.category || nextErrors.location || !category) {
      return;
    }

    let location = legacyLocation?.trim() ?? '';
    let locationId: string | null = null;

    if (selectedLocationId) {
      const selectedLocation = getLocation(selectedLocationId);
      if (!selectedLocation) {
        setErrors((current) => ({
          ...current,
          location: 'That storage location could not be found. Choose another one.',
        }));
        return;
      }
      location = formatLocationPath(selectedLocation);
      locationId = selectedLocationId;
    }

    try {
      setSaveError(null);
      await updateItem(itemId, {
        name,
        category,
        location,
        locationId,
        notes,
        imageChange: resolveImageChange(),
      });
      router.replace(`/item/${itemId}`);
    } catch (caughtError) {
      setSaveError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not save changes to the local database.',
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
        <Text style={styles.title}>Edit Item</Text>
        <Text style={styles.subtitle}>
          Update the details, location, and photo stored on this device. The original added date
          stays the same.
        </Text>
      </View>

      {status === 'loading' ? (
        <DatabaseState
          isLoading
          title="Loading item"
          message="Reading this item from the local database."
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

      {status === 'ready' && !item ? (
        <DatabaseState
          title="Item not found"
          message="This item may have been deleted, or the link is no longer valid."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      ) : null}

      {status === 'ready' && item ? (
        <>
          <TextField
            label="Item name"
            value={name}
            onChangeText={(value) => {
              setName(value);
              setSaveError(null);
            }}
            placeholder="Passport, charger, winter coat"
            error={errors.name}
          />

          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.choices}>
              {categories.map((option) => {
                const selected = option.id === category;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setCategory(option.id);
                      setSaveError(null);
                      setErrors((current) => ({ ...current, category: undefined }));
                    }}
                    style={[
                      styles.choice,
                      selected && { backgroundColor: option.tint, borderColor: option.color },
                    ]}
                  >
                    <Text style={styles.choiceIcon}>{option.icon}</Text>
                    <Text style={[styles.choiceLabel, selected && { color: option.color }]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.category ? <Text style={styles.error}>{errors.category}</Text> : null}
          </View>

          {legacyLocation && !selectedLocationId ? (
            <View style={styles.legacyCard}>
              <Text style={styles.legacyLabel}>Current location</Text>
              <Text style={styles.legacyValue}>{legacyLocation}</Text>
              <Text style={styles.legacyHint}>
                This item still uses older free-text location text. Choose a saved location below to
                upgrade it, or leave it unchanged.
              </Text>
            </View>
          ) : null}

          <LocationSelector
            selectedLocationId={selectedLocationId}
            error={errors.location}
            onSelect={(locationId) => {
              setSelectedLocationId(locationId);
              setSaveError(null);
              setErrors((current) => ({ ...current, location: undefined }));
            }}
          />

          <TextField
            label="Notes"
            value={notes}
            onChangeText={(value) => {
              setNotes(value);
              setSaveError(null);
            }}
            placeholder="Optional details that will help you find it"
            multiline
          />

          <PhotoPickerField
            previewUri={previewUri}
            onChangePreviewUri={(uri) => {
              setPreviewUri(uri);
              setSaveError(null);
            }}
          />

          {saveError ? (
            <View style={styles.failure}>
              <Text style={styles.failureTitle}>Could not save changes</Text>
              <Text style={styles.failureBody}>{saveError}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label={isSaving ? 'Saving…' : 'Save changes'}
            disabled={isSaving}
            onPress={() => {
              if (!isSaving) {
                void saveChanges();
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
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  choiceIcon: {
    fontSize: 16,
  },
  choiceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
  },
  legacyCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.card,
    padding: 14,
    gap: 4,
  },
  legacyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  legacyValue: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    color: colors.text,
  },
  legacyHint: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryDark,
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
