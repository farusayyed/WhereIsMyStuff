import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DatabaseState } from '@/components/DatabaseState';
import { EmptyState } from '@/components/EmptyState';
import { ItemCard } from '@/components/ItemCard';
import { Screen } from '@/components/Screen';
import { useInventory } from '@/context/InventoryContext';
import { getCategory, isCategoryId } from '@/data/categories';
import { itemsInCategory } from '@/lib/items';
import { colors, radius } from '@/theme';

export default function CategoryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const categoryId = typeof params.id === 'string' ? params.id : '';
  const category = isCategoryId(categoryId) ? getCategory(categoryId) : undefined;
  const { items, status, error, toggleFavorite, retryInitialization } = useInventory();
  const categoryItems = category ? itemsInCategory(items, category.id) : [];

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

      {category ? (
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: category.tint }]}>
            <Text style={styles.icon}>{category.icon}</Text>
          </View>
          <Text style={styles.title}>{category.label}</Text>
          <Text style={styles.subtitle}>{category.description}</Text>
          {status === 'ready' ? (
            <Text style={styles.count}>
              {categoryItems.length === 1
                ? '1 saved item'
                : `${categoryItems.length} saved items`}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.header}>
          <Text style={styles.title}>Unknown category</Text>
          <Text style={styles.subtitle}>That category is not part of this app.</Text>
        </View>
      )}

      {status === 'loading' ? (
        <DatabaseState
          isLoading
          title="Loading items"
          message="Reading this category from the local database."
        />
      ) : null}

      {status === 'error' ? (
        <DatabaseState
          title="Could not load items"
          message={error ?? 'The local database could not be opened.'}
          actionLabel="Try again"
          onAction={() => {
            void retryInitialization();
          }}
        />
      ) : null}

      {status === 'ready' && category && categoryItems.length === 0 ? (
        <EmptyState
          title="Nothing in this category"
          message="Items you save with this category will show up here."
          actionLabel="Add an item"
          onAction={() => router.push('/add')}
        />
      ) : null}

      {status === 'ready' && categoryItems.length > 0 ? (
        <View style={styles.list}>
          {categoryItems.map((item) => (
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
    gap: 8,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
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
  count: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  list: {
    gap: 12,
  },
});
