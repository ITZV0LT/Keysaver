import * as FileSystem from 'expo-file-system';
import { getSettings } from './storage';

export async function analyzeKey(imageUri) {
  const settings = await getSettings();
  const baseUrl = settings.apiBaseUrl || 'https://keysaver-web.vercel.app';

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(`${baseUrl}/api/analyze-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return response.json();
}
