import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS_STORAGE_KEY = '@keysaver:keys';
const SETTINGS_STORAGE_KEY = '@keysaver:settings';

export async function getAllKeys() {
  try {
    const raw = await AsyncStorage.getItem(KEYS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveKey(keyData) {
  const keys = await getAllKeys();
  const existing = keys.findIndex(k => k.id === keyData.id);
  if (existing >= 0) {
    keys[existing] = keyData;
  } else {
    keys.unshift(keyData);
  }
  await AsyncStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
  return keyData;
}

export async function deleteKey(id) {
  const keys = await getAllKeys();
  const updated = keys.filter(k => k.id !== id);
  await AsyncStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(updated));
}

export async function getSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { apiBaseUrl: 'https://keysaver-web.vercel.app' };
  } catch {
    return { apiBaseUrl: 'https://keysaver-web.vercel.app' };
  }
}

export async function saveSettings(settings) {
  await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
