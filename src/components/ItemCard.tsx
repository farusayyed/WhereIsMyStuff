import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ItemImage } from '@/components/ItemImage';
import { getCategory } from '@/data/categories';
import { formatAddedDate } from '@/lib/items';
import type { Item } from '@/types/inventory';
import { colors, radius } from '@/theme';

type ItemCardProps = {
  item: Item;
  onPress: () => void;
  onToggleFavorite: () => void;
};

export function ItemCard({ item, onPress, onToggleFavorite }: ItemCardProps) {
  const category = getCategory(item.category);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open details for ${item.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <ItemImage uri={item.imageUri} size="card" />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  item.isFavorite ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`
                }
                hitSlop={8}
                onPress={(event) => {
                  event.stopPropagation?.();
                  onToggleFavorite();
                }}
                style={({ pressed }) => [styles.favoriteButton, pressed && styles.favoritePressed]}
              >
                <Text style={styles.favoriteIcon}>{item.isFavorite ? '★' : '☆'}</Text>
              </Pressable>
              <View style={[styles.pill, { backgroundColor: category?.tint ?? colors.border }]}>
                <Text style={[styles.pillText, { color: category?.color ?? colors.text }]}>
                  {category?.label ?? 'Other'}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.location}>{item.location}</Text>
          {item.notes ? (
            <Text style={styles.notes} numberOfLines={2}>
              {item.notes}
            </Text>
          ) : null}
          <Text style={styles.date}>Added on {formatAddedDate(item.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  pressed: {
    opacity: 0.88,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  favoritePressed: {
    opacity: 0.75,
  },
  favoriteIcon: {
    fontSize: 18,
    color: colors.primaryDark,
    lineHeight: 22,
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  location: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  date: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
