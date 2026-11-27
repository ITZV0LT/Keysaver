import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as MediaLibrary from 'expo-media-library';
import { analyzeKey } from '../services/api';
import { muteShutter, unmuteShutter } from '../utils/CameraUtils';
import { saveKey } from '../services/storage';

const COLORS = {
  bg: '#0f172a',
  surface: '#1e293b',
  accent: '#6366f1',
  text: '#f1f5f9',
  muted: '#94a3b8',
  border: '#334155',
  success: '#22c55e',
  danger: '#ef4444',
};

const STEPS = { CAPTURE: 'capture', ANALYZING: 'analyzing', REVIEW: 'review', SAVING: 'saving' };

// The frame region as fractions of the camera view.
// These constants drive BOTH the overlay display and the actual crop —
// so whatever the user sees in the box is exactly what gets sent to the AI.
const FRAME_Y = 0.30;   // frame top = 30% from top of camera view
const FRAME_H = 0.25;   // frame height = 25% of camera view height
const FRAME_X = 0.05;   // frame left = 5% from left
const FRAME_W = 0.90;   // frame width = 90% of camera view width

export default function AddKeyScreen({ navigation }) {
  const [step, setStep] = useState(STEPS.CAPTURE);
  const [showCamera, setShowCamera] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [keyName, setKeyName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Layout state used to map overlay coords → photo crop coords
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const [frameLayout, setFrameLayout] = useState(null);

  async function openCamera() {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission', 'Camera access is required to photograph keys.');
        return;
      }
    }
    // Lock to portrait so the overlay and frame don't spin while scanning
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    setShowCamera(true);
  }

  async function closeCamera() {
    setShowCamera(false);
    await ScreenOrientation.unlockAsync();
  }

  async function takePhoto() {
    if (!cameraRef.current) return;

    muteShutter();
    let photo;
    try {
      photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
    } catch {
      unmuteShutter();
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return;
    }
    unmuteShutter();
    closeCamera();

    try {
      const actions = [];

      // Crop to the frame overlay using the cover-fit transform.
      // The camera preview "cover"-fits the photo onto the screen:
      // one axis is scaled to fill, the other may be clipped symmetrically.
      // We reverse that transform to find the photo-pixel rect that corresponds
      // to the overlay frame the user sees on screen.
      if (frameLayout && cameraLayout.width > 0 && cameraLayout.height > 0) {
        const camW = cameraLayout.width;
        const camH = cameraLayout.height;
        const photoW = photo.width;
        const photoH = photo.height;
        const camAR = camW / camH;
        const photoAR = photoW / photoH;

        let scale, offsetX, offsetY;
        if (photoAR > camAR) {
          // Photo is wider → preview clips the left/right sides
          scale = photoH / camH;
          offsetX = (photoW - camW * scale) / 2;
          offsetY = 0;
        } else {
          // Photo is taller → preview clips the top/bottom
          scale = photoW / camW;
          offsetX = 0;
          offsetY = (photoH - camH * scale) / 2;
        }

        const originX = Math.max(0, Math.round(offsetX + frameLayout.x * scale));
        const originY = Math.max(0, Math.round(offsetY + frameLayout.y * scale));
        const cropW = Math.min(photoW - originX, Math.round(frameLayout.width * scale));
        const cropH = Math.min(photoH - originY, Math.round(frameLayout.height * scale));

        if (cropW > 10 && cropH > 10) {
          actions.push({ crop: { originX, originY, width: cropW, height: cropH } });
        }
      }

      // Always resize + compress — keeps the payload well under 500 KB (fixes 413)
      actions.push({ resize: { width: 1200 } });

      const result = await ImageManipulator.manipulateAsync(
        photo.uri,
        actions,
        { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
      );
      processImage(result.uri);
    } catch {
      // Fallback: send original (may hit size limit but better than crashing)
      processImage(photo.uri);
    }
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1.0,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        const compressed = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
        );
        processImage(compressed.uri);
      } catch {
        processImage(result.assets[0].uri);
      }
    }
  }

  async function processImage(uri) {
    setImageUri(uri);
    setStep(STEPS.ANALYZING);
    setError(null);
    try {
      const { analysis, annotatedImageUri } = await analyzeKey(uri);
      setAnalysis(analysis);
      // Use the annotated image (red bitting trace) if the server produced one
      if (annotatedImageUri) setImageUri(annotatedImageUri);
      setKeyName(analysis.suggestedName || '');
      setStep(STEPS.REVIEW);
    } catch (e) {
      setError(e.message);
      setStep(STEPS.CAPTURE);
    }
  }

  async function handleSave() {
    if (!keyName.trim()) {
      Alert.alert('Name required', 'Please give this key a name before saving.');
      return;
    }
    setStep(STEPS.SAVING);
    const keyRecord = {
      id: `key_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: keyName.trim(),
      notes: notes.trim(),
      imageUri,
      analysis,
      createdAt: new Date().toISOString(),
    };
    await saveKey(keyRecord);
    setStep(STEPS.CAPTURE);
    setImageUri(null);
    setAnalysis(null);
    setKeyName('');
    setNotes('');
    navigation.navigate('Keys');
  }

  function handleRetake() {
    setImageUri(null);
    setAnalysis(null);
    setKeyName('');
    setNotes('');
    setStep(STEPS.CAPTURE);
  }

  // ─── Camera screen ────────────────────────────────────────────────────────
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          facing="back"
          onLayout={(e) => setCameraLayout(e.nativeEvent.layout)}
        >
          {/* Mask overlay — four dark bands leave the frame area clear */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            <View style={styles.maskTop} />
            <View style={styles.maskLeft} />
            <View style={styles.maskRight} />
            <View style={styles.maskBottom} />

            {/* The frame — transparent background, corner brackets */}
            <View
              style={styles.keyFrame}
              onLayout={(e) => setFrameLayout(e.nativeEvent.layout)}
            >
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>

            <Text style={styles.frameLabel}>Position key horizontally in frame</Text>
            <Text style={styles.frameHint}>AI analyzes only this area</Text>
          </View>

          {/* Shutter controls sit at the bottom of the camera view */}
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeCamera}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shutterBtn} onPress={takePhoto}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>
            <View style={{ width: 70 }} />
          </View>
        </CameraView>
      </View>
    );
  }

  // ─── Analyzing screen ─────────────────────────────────────────────────────
  if (step === STEPS.ANALYZING) {
    return (
      <View style={styles.centerContainer}>
        <Image source={{ uri: imageUri }} style={styles.previewThumb} />
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 24 }} />
        <Text style={styles.analyzingTitle}>Analyzing Key...</Text>
        <Text style={styles.analyzingText}>
          AI is identifying the key type, keyway, and bitting pattern
        </Text>
      </View>
    );
  }

  // ─── Saving screen ────────────────────────────────────────────────────────
  if (step === STEPS.SAVING) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.success} />
        <Text style={styles.analyzingTitle}>Saving Key...</Text>
      </View>
    );
  }

  // ─── Review screen ────────────────────────────────────────────────────────
  if (step === STEPS.REVIEW && analysis) {
    const conf = analysis.confidence || 'unknown';
    const confColor = conf === 'high' ? COLORS.success : conf === 'medium' ? '#f59e0b' : COLORS.muted;

    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
          <Image source={{ uri: imageUri }} style={styles.reviewImage} resizeMode="cover" />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Analysis</Text>

            <View style={styles.confBadge}>
              <View style={[styles.confDot, { backgroundColor: confColor }]} />
              <Text style={[styles.confText, { color: confColor }]}>
                {conf.charAt(0).toUpperCase() + conf.slice(1)} confidence
              </Text>
            </View>

            <AnalysisRow icon="🔑" label="Key Type" value={analysis.keyType} />
            <AnalysisRow icon="⚙️" label="Keyway" value={analysis.keyway || 'Not identified'} />
            <AnalysisRow
              icon="📊"
              label="Bitting Code"
              value={analysis.bitting || 'Not determined'}
              mono
            />
            <AnalysisRow icon="🏭" label="Manufacturer" value={analysis.manufacturer || 'Unknown'} />

            {analysis.notes && (
              <View style={styles.notesBox}>
                <Text style={styles.notesBoxText}>{analysis.notes}</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Save Key</Text>
            <TextInput
              style={styles.input}
              value={keyName}
              onChangeText={setKeyName}
              placeholder="Key name (e.g. Front Door, Car Key)"
              placeholderTextColor={COLORS.muted}
              maxLength={50}
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (optional)"
              placeholderTextColor={COLORS.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={200}
            />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
              <Text style={styles.retakeBtnText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Key</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── Capture screen (default) ─────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={{ color: COLORS.muted, marginTop: 4 }}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.captureCard}>
        <Text style={styles.captureIcon}>📷</Text>
        <Text style={styles.captureTitle}>Photograph a Key</Text>
        <Text style={styles.captureText}>
          Take a clear side-profile photo of your key for AI analysis
        </Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={openCamera}>
          <Text style={styles.primaryBtnText}>Open Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={pickFromLibrary}>
          <Text style={styles.secondaryBtnText}>Choose from Library</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Tips for best results</Text>
        {[
          'Lay key flat on a light-colored surface',
          'Photograph from the side (profile view)',
          'Use good lighting — avoid shadows',
          'Keep the key in sharp focus',
          'Include the full key from bow to tip',
        ].map((tip, i) => (
          <Text key={i} style={styles.tip}>• {tip}</Text>
        ))}
      </View>
    </View>
  );
}

function AnalysisRow({ icon, label, value, mono }) {
  return (
    <View style={styles.analysisRow}>
      <Text style={styles.analysisIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.analysisLabel}>{label}</Text>
        <Text style={[styles.analysisValue, mono && styles.monoValue]}>
          {value || '—'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centerContainer: {
    flex: 1, backgroundColor: COLORS.bg,
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },

  // ── Camera ──────────────────────────────────────────────────────────────
  cameraContainer: { flex: 1 },
  camera: { flex: 1, justifyContent: 'flex-end' },

  // Four dark bands surrounding the clear frame area
  maskTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: `${FRAME_Y * 100}%`,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  maskLeft: {
    position: 'absolute',
    top: `${FRAME_Y * 100}%`,
    left: 0,
    width: `${FRAME_X * 100}%`,
    height: `${FRAME_H * 100}%`,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  maskRight: {
    position: 'absolute',
    top: `${FRAME_Y * 100}%`,
    right: 0,
    width: `${FRAME_X * 100}%`,
    height: `${FRAME_H * 100}%`,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  maskBottom: {
    position: 'absolute',
    top: `${(FRAME_Y + FRAME_H) * 100}%`,
    left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },

  // The transparent scanning frame with corner brackets
  keyFrame: {
    position: 'absolute',
    top: `${FRAME_Y * 100}%`,
    left: `${FRAME_X * 100}%`,
    width: `${FRAME_W * 100}%`,
    height: `${FRAME_H * 100}%`,
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 22, height: 22,
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#6366f1',
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: 3, borderRightWidth: 3, borderColor: '#6366f1',
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#6366f1',
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#6366f1',
  },

  frameLabel: {
    position: 'absolute',
    top: `${(FRAME_Y - 0.065) * 100}%`,
    left: 0, right: 0,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  frameHint: {
    position: 'absolute',
    top: `${(FRAME_Y + FRAME_H + 0.018) * 100}%`,
    left: 0, right: 0,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.70)',
    fontSize: 12,
  },

  cameraControls: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44,
  },
  cancelBtn: { padding: 8 },
  cancelBtnText: { color: '#fff', fontSize: 16 },
  shutterBtn: {
    width: 70, height: 70, borderRadius: 35,
    borderWidth: 4, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  shutterInner: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff',
  },

  // ── Analyzing ────────────────────────────────────────────────────────────
  previewThumb: {
    width: 200, height: 120, borderRadius: 12, backgroundColor: COLORS.surface,
  },
  analyzingTitle: {
    color: COLORS.text, fontSize: 20, fontWeight: '700', marginTop: 16,
  },
  analyzingText: {
    color: COLORS.muted, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20,
  },

  // ── Review ───────────────────────────────────────────────────────────────
  reviewImage: {
    width: '100%', height: 220, backgroundColor: COLORS.surface,
  },
  section: { padding: 16, gap: 8 },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  confBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  confDot: { width: 8, height: 8, borderRadius: 4 },
  confText: { fontSize: 13, fontWeight: '600' },
  analysisRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, gap: 10,
    marginVertical: 3,
  },
  analysisIcon: { fontSize: 18 },
  analysisLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  analysisValue: { color: COLORS.text, fontSize: 15, fontWeight: '500', marginTop: 2 },
  monoValue: { fontFamily: 'monospace', color: '#22c55e', fontSize: 16, fontWeight: '700' },
  notesBox: {
    backgroundColor: '#1e3a2f', borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#22c55e',
  },
  notesBoxText: { color: '#86efac', fontSize: 13, lineHeight: 18 },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 12,
    color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border,
    marginVertical: 4,
  },
  textarea: { minHeight: 80 },
  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 8 },
  retakeBtn: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  retakeBtnText: { color: COLORS.muted, fontWeight: '600', fontSize: 15 },
  saveBtn: {
    flex: 2, backgroundColor: COLORS.accent,
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // ── Capture card ─────────────────────────────────────────────────────────
  captureCard: {
    margin: 20, backgroundColor: COLORS.surface,
    borderRadius: 16, padding: 24, alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  captureIcon: { fontSize: 56 },
  captureTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  captureText: { color: COLORS.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  primaryBtn: {
    width: '100%', backgroundColor: COLORS.accent,
    borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    width: '100%', backgroundColor: 'transparent',
    borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  secondaryBtnText: { color: COLORS.muted, fontWeight: '600', fontSize: 15 },
  tipsCard: {
    marginHorizontal: 20, marginTop: 4, backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 16, gap: 6,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tipsTitle: { color: COLORS.text, fontWeight: '600', fontSize: 14, marginBottom: 4 },
  tip: { color: COLORS.muted, fontSize: 13 },
  errorBox: {
    margin: 16, backgroundColor: '#3f1212',
    borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderLeftColor: COLORS.danger,
  },
  errorText: { color: '#fca5a5', fontSize: 13 },
});
