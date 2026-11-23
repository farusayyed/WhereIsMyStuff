import { useState } from 'react';
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
import type { CategoryId } from '@/types/inventory';
import { colors, radius } from '@/theme';

type FormErrors = {
  name?: string;
  category?: string;
  location?: string;
};

export default function AddItemScreen() {
  const { addItem, getLocation, status, error, isSaving, retryInitialization } = useInventory();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [savedName, setSavedName] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function updateName(value: string) {
    setName(value);
    setSavedName(null);
    setSaveError(null);
  }

  function selectCategory(nextCategory: CategoryId) {
    setCategory(nextCategory);
    setSavedName(null);
    setSaveError(null);
    setErrors((current) => ({ ...current, category: undefined }));
  }

  async function saveItem() {
    const nextErrors: FormErrors = {};
    if (!name.trim()) {
      nextErrors.name = 'Enter a name for this item.';
    }
    if (!category) {
      nextErrors.category = 'Choose a category.';
    }
    if (!selectedLocationId) {
      nextErrors.location = 'Choose or create a storage location.';
    }

    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.category || nextErrors.location || !category || !selectedLocationId) {
      setSavedName(null);
      return;
    }

    const selectedLocation = getLocation(selectedLocationId);
    if (!selectedLocation) {
      setErrors((current) => ({
        ...current,
        location: 'That storage location could not be found. Choose another one.',
      }));
      return;
    }

    const saved = name.trim();

    try {
      await addItem({
        name: saved,
        category,
        location: formatLocationPath(selectedLocation),
        locationId: selectedLocationId,
        notes,
        imageChange: previewUri
          ? { type: 'new', sourceUri: previewUri }
          : { type: 'unchanged' },
      });
      setName('');
      setCategory(null);
      setSelectedLocationId(null);
      setNotes('');
      setPreviewUri(null);
      setSaveError(null);
      setSavedName(saved);
    } catch (caughtError) {
      setSavedName(null);
      setSaveError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not save this item to the local database.',
      );
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>New item</Text>
        <Text style={styles.title}>Add Item</Text>
        <Text style={styles.subtitle}>
          Save a name, storage location, and optional photo. Everything stays on this device.
        </Text>
      </View>

      {status === 'loading' ? (
        <DatabaseState
          isLoading
          title="Preparing storage"
          message="The local database needs to finish opening before you can save items."
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
            label="Item name"
            value={name}
            onChangeText={updateName}
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
                    onPress={() => selectCategory(option.id)}
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

          <LocationSelector
            selectedLocationId={selectedLocationId}
            error={errors.location}
            onSelect={(locationId) => {
              setSelectedLocationId(locationId);
              setSavedName(null);
              setSaveError(null);
              setErrors((current) => ({ ...current, location: undefined }));
            }}
          />

          <TextField
            label="Notes"
            value={notes}
            onChangeText={(value) => {
              setNotes(value);
              setSavedName(null);
              setSaveError(null);
            }}
            placeholder="Optional details that will help you find it"
            multiline
          />

          <PhotoPickerField
            previewUri={previewUri}
            onChangePreviewUri={(uri) => {
              setPreviewUri(uri);
              setSavedName(null);
              setSaveError(null);
            }}
          />

          {saveError ? (
            <View style={styles.failure}>
              <Text style={styles.failureTitle}>Could not save item</Text>
              <Text style={styles.failureBody}>{saveError}</Text>
            </View>
          ) : null}

          {savedName ? (
            <View style={styles.success}>
              <Text style={styles.successTitle}>Saved {savedName}</Text>
              <Text style={styles.successBody}>
                It is stored on this device and will still be here after you close the app.
              </Text>
            </View>
          ) : null}

          <PrimaryButton
            label={isSaving ? 'Saving…' : 'Save item'}
            disabled={isSaving}
            onPress={() => {
              if (!isSaving) {
                void saveItem();
              }
            }}
          />
        </>
      ) : null}
    </Screen>
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
  success: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.card,
    padding: 16,
    gap: 4,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  successBody: {
    fontSize: 14,
    lineHeight: 20,
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
