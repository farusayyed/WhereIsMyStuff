import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { DatabaseState } from '@/components/DatabaseState';
import { ItemImage } from '@/components/ItemImage';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { useInventory } from '@/context/InventoryContext';
import { getCategory } from '@/data/categories';
import { formatAddedDateTime } from '@/lib/items';
import { colors, radius } from '@/theme';

export default function ItemDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const itemId = typeof params.id === 'string' ? params.id : '';
  const {
    status,
    error,
    isSaving,
    getItem,
    deleteItem,
    toggleFavorite,
    retryInitialization,
  } = useInventory();
  const item = getItem(itemId);
  const category = item ? getCategory(item.category) : undefined;
  const [actionError, setActionError] = useState<string | null>(null);

  function confirmDelete() {
    if (!item) {
      return;
    }

    Alert.alert(
      'Delete item?',
      `“${item.name}” will be permanently removed from this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void handleDelete();
          },
        },
      ],
    );
  }

  async function handleDelete() {
    try {
      setActionError(null);
      await deleteItem(itemId);
      router.back();
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Could not delete this item from the local database.',
      );
    }
  }

  async function handleToggleFavorite() {
    try {
      setActionError(null);
      await toggleFavorite(itemId);
    } catch (toggleError) {
      setActionError(
        toggleError instanceof Error
          ? toggleError.message
          : 'Could not update the favorite status.',
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

      {status === 'loading' ? (
        <DatabaseState
          isLoading
          title="Loading item"
          message="Reading this item from the local database."
        />
      ) : null}

      {status === 'error' ? (
        <DatabaseState
          title="Could not load item"
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
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Item details</Text>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{item.name}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  item.isFavorite ? 'Remove from favorites' : 'Add to favorites'
                }
                onPress={() => {
                  void handleToggleFavorite();
                }}
                style={({ pressed }) => [styles.favoriteButton, pressed && styles.favoritePressed]}
              >
                <Text style={styles.favoriteIcon}>{item.isFavorite ? '★' : '☆'}</Text>
              </Pressable>
            </View>
            <View style={[styles.pill, { backgroundColor: category?.tint ?? colors.border }]}>
              <Text style={[styles.pillText, { color: category?.color ?? colors.text }]}>
                {category?.label ?? 'Other'}
              </Text>
            </View>
            <Text style={styles.favoriteHint}>
              {item.isFavorite ? 'Saved in Favorites' : 'Not in Favorites'}
            </Text>
          </View>

          <ItemImage uri={item.imageUri} size="detail" />

          <View style={styles.card}>
            <DetailRow label="Category" value={category?.label ?? 'Other'} />
            <DetailRow label="Storage location" value={item.location || 'No location saved'} />
            <DetailRow
              label="Notes"
              value={item.notes.trim() ? item.notes : 'No notes added'}
            />
            <DetailRow label="Added" value={formatAddedDateTime(item.createdAt)} />
            {item.updatedAt !== item.createdAt ? (
              <DetailRow label="Last updated" value={formatAddedDateTime(item.updatedAt)} />
            ) : null}
          </View>

          {actionError ? (
            <View style={styles.failure}>
              <Text style={styles.failureTitle}>Something went wrong</Text>
              <Text style={styles.failureBody}>{actionError}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label={item.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            variant="secondary"
            onPress={() => {
              void handleToggleFavorite();
            }}
          />
          <PrimaryButton
            label="Edit item"
            onPress={() => router.push(`/item/edit/${item.id}`)}
          />
          <PrimaryButton
            label={isSaving ? 'Deleting…' : 'Delete item'}
            variant="danger"
            disabled={isSaving}
            onPress={confirmDelete}
          />
        </>
      ) : null}
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
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
    gap: 10,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: colors.text,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  favoritePressed: {
    opacity: 0.8,
  },
  favoriteIcon: {
    fontSize: 24,
    color: colors.primaryDark,
    lineHeight: 28,
  },
  favoriteHint: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 16,
  },
  row: {
    gap: 4,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  rowValue: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.text,
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
