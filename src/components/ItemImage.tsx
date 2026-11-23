import { Image, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radius } from '@/theme';

type ItemImageProps = {
  uri?: string | null;
  size?: 'card' | 'detail' | 'editor';
  style?: StyleProp<ViewStyle>;
};

export function ItemImage({ uri, size = 'card', style }: ItemImageProps) {
  const frameStyle =
    size === 'detail' ? styles.detail : size === 'editor' ? styles.editor : styles.card;

  if (uri) {
    return (
      <View style={[styles.frame, frameStyle, style]}>
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      </View>
    );
  }

  return (
    <View style={[styles.frame, frameStyle, styles.placeholder, style]}>
      <Text style={styles.placeholderIcon}>📷</Text>
      <Text style={styles.placeholderLabel}>
        {size === 'card' ? 'No photo' : 'No photo added'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    width: 72,
    height: 72,
  },
  detail: {
    width: '100%',
    height: 220,
  },
  editor: {
    width: '100%',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  placeholderIcon: {
    fontSize: 22,
  },
  placeholderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
    textAlign: 'center',
  },
});
