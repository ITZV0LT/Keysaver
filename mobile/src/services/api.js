import * as FileSystem from 'expo-file-system';
import { getSettings } from './storage';

export async function analyzeKey(imageUri) {
  const settings = await getSettings();
  const baseUrl = settings.apiBaseUrl || 'https://keysaver-app.vercel.app';

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

  const data = await response.json();
  const { annotatedImage, ...analysis } = data;

  // Save the annotated image to a local file so it can be stored and displayed
  let annotatedImageUri = null;
  if (annotatedImage) {
    try {
      const dir = `${FileSystem.documentDirectory}keysaver/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const fileUri = `${dir}annotated_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(fileUri, annotatedImage, {
        encoding: FileSystem.EncodingType.Base64,
      });
      annotatedImageUri = fileUri;
    } catch (e) {
      console.warn('Could not save annotated image:', e.message);
    }
  }

  return { analysis, annotatedImageUri };
}
