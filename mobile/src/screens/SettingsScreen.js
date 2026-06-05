import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, Linking,
} from 'react-native';
import { getSettings, saveSettings, getAllKeys, deleteKey } from '../services/storage';

const COLORS = {
  bg: '#0f172a',
  surface: '#1e293b',
  accent: '#6366f1',
  text: '#f1f5f9',
  muted: '#94a3b8',
  border: '#334155',
  danger: '#ef4444',
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState({ apiBaseUrl: 'https://keysaver-web.vercel.app' });
  const [keyCount, setKeyCount] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
    getAllKeys().then(keys => setKeyCount(keys.length));
  }, []);

  async function handleSave() {
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleClearAll() {
    Alert.alert(
      'Clear All Keys',
      `This will permanently delete all ${keyCount} saved keys. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            const keys = await getAllKeys();
            for (const k of keys) await deleteKey(k.id);
            setKeyCount(0);
            Alert.alert('Done', 'All keys have been deleted.');
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Configuration</Text>
        <Text style={styles.label}>Backend URL</Text>
        <TextInput
          style={styles.input}
          value={settings.apiBaseUrl}
          onChangeText={url => setSettings(s => ({ ...s, apiBaseUrl: url }))}
          placeholder="https://keysaver-web.vercel.app"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="none"
          keyboardType="url"
        />
        <Text style={styles.hint}>
          The KeySaver API server URL. Change this if you self-host the backend.
        </Text>
        <TouchableOpacity
          style={[styles.btn, saved && styles.btnSuccess]}
          onPress={handleSave}
        >
          <Text style={styles.btnText}>{saved ? '✓ Saved!' : 'Save Settings'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Keys saved</Text>
          <Text style={styles.infoValue}>{keyCount}</Text>
        </View>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleClearAll} disabled={keyCount === 0}>
          <Text style={styles.dangerBtnText}>Clear All Keys</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Powered by</Text>
          <Text style={styles.infoValue}>Claude Vision AI</Text>
        </View>
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ KeySaver is intended for managing your own keys only. Bitting analysis
            accuracy depends on image quality and angle. Always verify with a licensed
            locksmith for critical applications.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  section: {
    margin: 16, backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 16, gap: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  label: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: '#0f172a', borderRadius: 8, padding: 10,
    color: COLORS.text, fontSize: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  hint: { color: COLORS.muted, fontSize: 12, lineHeight: 16 },
  btn: {
    backgroundColor: COLORS.accent, borderRadius: 10,
    padding: 12, alignItems: 'center',
  },
  btnSuccess: { backgroundColor: '#16a34a' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  infoLabel: { color: COLORS.muted, fontSize: 14 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  dangerBtn: {
    backgroundColor: '#3f1212', borderRadius: 10,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.danger,
  },
  dangerBtnText: { color: '#fca5a5', fontWeight: '700', fontSize: 14 },
  disclaimer: {
    backgroundColor: '#1e2a1a', borderRadius: 8, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#f59e0b',
  },
  disclaimerText: { color: '#fde68a', fontSize: 12, lineHeight: 18 },
});
