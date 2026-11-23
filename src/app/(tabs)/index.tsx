import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CategoryCard } from '@/components/CategoryCard';
import { DatabaseState } from '@/components/DatabaseState';
import { EmptyState } from '@/components/EmptyState';
import { ItemCard } from '@/components/ItemCard';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { useInventory } from '@/context/InventoryContext';
import { categories } from '@/data/categories';
import { filterItems, sortByNewest } from '@/lib/items';
import { colors } from '@/theme';

export default function HomeScreen() {
  const { items, status, error, toggleFavorite, retryInitialization } = useInventory();
  const [query, setQuery] = useState('');
  const isSearching = query.trim().length > 0;

  const visibleItems = useMemo(
    () => sortByNewest(filterItems(items, query)),
    [items, query],
  );

  const countLabel = items.length === 1 ? '1 item saved' : `${items.length} items saved`;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Home inventory</Text>
        <Text style={styles.title}>Where Is My Stuff?</Text>
        <Text style={styles.subtitle}>
          A private list of the places you keep things around the house.
        </Text>
      </View>

      {status === 'loading' ? (
        <DatabaseState
          isLoading
          title="Opening your inventory"
          message="Loading the local SQLite database on this device."
        />
      ) : null}

      {status === 'error' ? (
        <DatabaseState
          title="Could not open inventory"
          message={error ?? 'The local database could not be opened.'}
          actionLabel="Try again"
          onAction={() => {
            void retryInitialization();
          }}
        />
      ) : null}

      {status === 'ready' ? (
        <>
          <SearchField value={query} onChangeText={setQuery} />

          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Total saved items</Text>
            <Text style={styles.summaryCount}>{items.length}</Text>
            <Text style={styles.summaryHint}>{countLabel} on this device</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category shortcuts</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shortcutRow}
            >
              {categories.map((category) => {
                const count = items.filter((item) => item.category === category.id).length;
                return (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    count={count}
                    compact
                    onPress={() => router.push(`/category/${category.id}`)}
                  />
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isSearching ? 'Search results' : 'Recently added'}
            </Text>
            {items.length === 0 ? (
              <EmptyState
                title="No saved items yet"
                message="Add something you want to find later. It will show up here with the place you stored it."
                actionLabel="Add an item"
                onAction={() => router.push('/add')}
              />
            ) : visibleItems.length === 0 ? (
              <EmptyState
                title="No items found"
                message="No saved items match that search. Try another name, place, note, or category."
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
                      void toggleFavorite(item.id);
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
  summary: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    gap: 2,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CCFBF1',
  },
  summaryCount: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryHint: {
    fontSize: 14,
    color: '#D1FAE5',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  shortcutRow: {
    gap: 12,
    paddingRight: 4,
  },
  list: {
    gap: 12,
  },
});
