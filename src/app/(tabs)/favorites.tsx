import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DatabaseState } from '@/components/DatabaseState';
import { EmptyState } from '@/components/EmptyState';
import { ItemCard } from '@/components/ItemCard';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { useInventory } from '@/context/InventoryContext';
import { filterItems, sortByNewest } from '@/lib/items';
import { colors } from '@/theme';

export default function FavoritesScreen() {
  const { items, status, error, toggleFavorite, retryInitialization } = useInventory();
  const [query, setQuery] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const isSearching = query.trim().length > 0;

  const favoriteItems = useMemo(
    () => sortByNewest(items.filter((item) => item.isFavorite)),
    [items],
  );

  const visibleItems = useMemo(
    () => sortByNewest(filterItems(favoriteItems, query)),
    [favoriteItems, query],
  );

  async function handleToggleFavorite(itemId: string) {
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
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Saved</Text>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>
          Items you mark with a star stay here so you can find them quickly.
        </Text>
      </View>

      {status === 'loading' ? (
        <DatabaseState
          isLoading
          title="Loading favorites"
          message="Reading favorite items from the local database."
        />
      ) : null}

      {status === 'error' ? (
        <DatabaseState
          title="Could not load favorites"
          message={error ?? 'The local database could not be opened.'}
          actionLabel="Try again"
          onAction={() => {
            void retryInitialization();
          }}
        />
      ) : null}

      {status === 'ready' ? (
        <>
          {favoriteItems.length > 0 ? (
            <SearchField value={query} onChangeText={setQuery} />
          ) : null}

          {actionError ? (
            <View style={styles.failure}>
              <Text style={styles.failureTitle}>Could not update favorite</Text>
              <Text style={styles.failureBody}>{actionError}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isSearching ? 'Search results' : 'Favorite items'}
            </Text>

            {favoriteItems.length === 0 ? (
              <EmptyState
                title="No favorites yet"
                message="Tap the star on an item card or item details page to add it here."
                actionLabel="Browse items"
                onAction={() => router.push('/')}
              />
            ) : visibleItems.length === 0 ? (
              <EmptyState
                title="No items found"
                message="No favorites match that search. Try another name, place, note, or category."
                actionLabel="Clear search"
                onAction={() => setQuery('')}
              />
            ) : (
              <View style={styles.list}>
                {visibleItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onPress={() => router.push(`/item/${item.id}`)}
                    onToggleFavorite={() => {
                      void handleToggleFavorite(item.id);
                    }}
                  />
                ))}
              </View>
            )}
          </View>
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
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  list: {
    gap: 12,
  },
  failure: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 16,
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
