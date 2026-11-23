import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Category } from '@/types/inventory';
import { colors, radius, spacing } from '@/theme';

type CategoryCardProps = {
  category: Category;
  count: number;
  compact?: boolean;
  onPress: () => void;
};

export function CategoryCard({ category, count, compact = false, onPress }: CategoryCardProps) {
  const itemLabel = count === 1 ? '1 item' : `${count} items`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${category.label}, ${itemLabel}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact ? styles.compact : styles.full,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: category.tint }]}>
        <Text style={styles.icon}>{category.icon}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.label} numberOfLines={1}>
          {category.label}
        </Text>
        <Text style={styles.count} numberOfLines={compact ? 1 : 2}>
          {compact ? itemLabel : category.description}
        </Text>
      </View>
      {compact ? null : (
        <View style={styles.meta}>
          <Text style={styles.countBadge}>{itemLabel}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compact: {
    width: 148,
    padding: spacing.card,
    gap: 12,
  },
  full: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.card,
    gap: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  chevron: {
    fontSize: 22,
    lineHeight: 22,
    color: colors.textMuted,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  count: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  meta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  countBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
