import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ItemImage } from '@/components/ItemImage';
import { colors, radius } from '@/theme';

type PhotoPickerFieldProps = {
  previewUri: string | null;
  onChangePreviewUri: (uri: string | null) => void;
};

export function PhotoPickerField({ previewUri, onChangePreviewUri }: PhotoPickerFieldProps) {
  const [permissionError, setPermissionError] = useState<string | null>(null);

  async function pickFromGallery() {
    setPermissionError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPermissionError(
        'Photo library access is needed to choose an item picture. You can enable it in Settings.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChangePreviewUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    setPermissionError(null);

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setPermissionError(
        'Camera access is needed to take an item picture. You can enable it in Settings.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChangePreviewUri(result.assets[0].uri);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Photo (optional)</Text>
      <ItemImage uri={previewUri} size="editor" />

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void pickFromGallery();
          }}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionLabel}>Choose photo</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void takePhoto();
          }}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionLabel}>Take photo</Text>
        </Pressable>
      </View>

      {previewUri ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setPermissionError(null);
            onChangePreviewUri(null);
          }}
          style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
        >
          <Text style={styles.removeLabel}>Remove photo</Text>
        </Pressable>
      ) : null}

      {permissionError ? <Text style={styles.error}>{permissionError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  action: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  remove: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  removeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },
  pressed: {
    opacity: 0.85,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
});
