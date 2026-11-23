import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/theme';

type DatabaseStateProps = {
  title: string;
  message: string;
  isLoading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function DatabaseState({
  title,
  message,
  isLoading = false,
  actionLabel,
  onAction,
}: DatabaseStateProps) {
  return (
    <View style={styles.wrap}>
      {isLoading ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
  button: {
    marginTop: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.control,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
