import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CategoryCard } from '@/components/CategoryCard';
import { DatabaseState } from '@/components/DatabaseState';
import { Screen } from '@/components/Screen';
import { useInventory } from '@/context/InventoryContext';
import { categories } from '@/data/categories';
import { colors } from '@/theme';

export default function CategoriesScreen() {
  const { items, status, error, retryInitialization } = useInventory();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Browse</Text>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>
          Pick a category to see the items stored in that group.
        </Text>
      </View>

      {status === 'loading' ? (
        <DatabaseState
          isLoading
          title="Loading categories"
          message="Reading your saved items from the local database."
        />
      ) : null}

      {status === 'error' ? (
        <DatabaseState
          title="Could not load categories"
          message={error ?? 'The local database could not be opened.'}
          actionLabel="Try again"
          onAction={() => {
            void retryInitialization();
          }}
        />
      ) : null}

      {status === 'ready' ? (
        <View style={styles.list}>
          {categories.map((category) => {
            const count = items.filter((item) => item.category === category.id).length;
            return (
              <CategoryCard
                key={category.id}
                category={category}
                count={count}
                onPress={() => router.push(`/category/${category.id}`)}
              />
            );
          })}
        </View>
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
  list: {
    gap: 12,
  },
});
