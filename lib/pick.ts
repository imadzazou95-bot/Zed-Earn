import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/** Open the gallery and return a persistable image URI (data-uri on native). */
export async function pickImage(): Promise<string | null> {
  try {
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return null;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: Platform.OS !== 'web',
      allowsEditing: false,
    });
    if (res.canceled || !res.assets?.length) return null;
    const a = res.assets[0];
    if (a.base64) return `data:image/jpeg;base64,${a.base64}`;
    return a.uri;
  } catch {
    return null;
  }
}
