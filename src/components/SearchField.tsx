import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius } from '@/theme';

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export function SearchField({ value, onChangeText }: SearchFieldProps) {
  const hasValue = value.length > 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>⌕</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search name, place, notes, or category"
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        clearButtonMode="never"
        returnKeyType="search"
        style={styles.input}
        accessibilityLabel="Search saved items"
      />
      {hasValue ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={() => onChangeText('')}
          style={({ pressed }) => [styles.clearButton, pressed && styles.clearPressed]}
        >
          <Text style={styles.clearLabel}>Clear</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  icon: {
    fontSize: 20,
    color: colors.textMuted,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  clearPressed: {
    opacity: 0.75,
  },
  clearLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
