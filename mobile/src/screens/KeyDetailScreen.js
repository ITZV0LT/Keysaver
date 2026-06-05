import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image,
  TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { getAllKeys, saveKey, deleteKey } from '../services/storage';

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

export default function KeyDetailScreen({ route, navigation }) {
  const { keyId } = route.params;
  const [keyData, setKeyData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadKey();
  }, [keyId]);

  async function loadKey() {
    const keys = await getAllKeys();
    const found = keys.find(k => k.id === keyId);
    if (found) {
      setKeyData(found);
      setName(found.name || '');
      setNotes(found.notes || '');
    }
  }

  async function handleSaveEdit() {
    const updated = { ...keyData, name: name.trim(), notes: notes.trim() };
    await saveKey(updated);
    setKeyData(updated);
    setEditing(false);
  }

  async function handleDelete() {
    Alert.alert('Delete Key', `Delete "${keyData.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteKey(keyId);
          navigation.goBack();
        },
      },
    ]);
  }

  if (!keyData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.muted }}>Loading...</Text>
      </View>
    );
  }

  const a = keyData.analysis || {};
  const conf = a.confidence || 'unknown';
  const confColor = conf === 'high' ? COLORS.success : conf === 'medium' ? '#f59e0b' : COLORS.muted;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {keyData.imageUri && (
        <Image source={{ uri: keyData.imageUri }} style={styles.hero} resizeMode="cover" />
      )}

      <View style={styles.header}>
        {editing ? (
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={50}
          />
        ) : (
          <Text style={styles.keyName}>{keyData.name}</Text>
        )}
        <Text style={styles.date}>
          Added {new Date(keyData.createdAt).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AI Analysis</Text>
          <View style={styles.confBadge}>
            <View style={[styles.confDot, { backgroundColor: confColor }]} />
            <Text style={[styles.confLabel, { color: confColor }]}>
              {conf} confidence
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <DetailCard icon="🔑" label="Key Type" value={a.keyType || 'Unknown'} />
          <DetailCard icon="⚙️" label="Keyway" value={a.keyway || 'Not identified'} />
          <DetailCard icon="🏭" label="Manufacturer" value={a.manufacturer || 'Unknown'} wide />
          {a.bitting && (
            <DetailCard icon="📊" label="Bitting Code" value={a.bitting} mono wide />
          )}
        </View>

        {a.notes && (
          <View style={styles.aiNotes}>
            <Text style={styles.aiNotesLabel}>AI Notes</Text>
            <Text style={styles.aiNotesText}>{a.notes}</Text>
          </View>
        )}
      </View>

      {(editing || keyData.notes) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          {editing ? (
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Add notes..."
              placeholderTextColor={COLORS.muted}
              maxLength={200}
            />
          ) : (
            <Text style={styles.notesText}>{keyData.notes || 'No notes'}</Text>
          )}
        </View>
      )}

      <View style={styles.bittingViz}>
        <Text style={styles.bittingVizTitle}>Bitting Visualization</Text>
        {a.bitting ? (
          <BittingChart bitting={a.bitting} />
        ) : (
          <Text style={{ color: COLORS.muted, fontSize: 13 }}>Bitting not available</Text>
        )}
      </View>

      <View style={styles.actions}>
        {editing ? (
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
              <Text style={styles.editBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function DetailCard({ icon, label, value, mono, wide }) {
  return (
    <View style={[styles.detailCard, wide && styles.detailCardWide]}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, mono && styles.detailValueMono]}>
        {value}
      </Text>
    </View>
  );
}

function BittingChart({ bitting }) {
  const cuts = bitting.split('-').map(Number).filter(n => !isNaN(n));
  const maxDepth = Math.max(...cuts, 9);

  return (
    <View style={styles.bittingChart}>
      {cuts.map((cut, i) => (
        <View key={i} style={styles.bittingColumn}>
          <View
            style={[
              styles.bittingBar,
              { height: (cut / maxDepth) * 60 + 10 },
            ]}
          />
          <Text style={styles.bittingNumber}>{cut}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  hero: { width: '100%', height: 240, backgroundColor: COLORS.surface },
  header: { padding: 20, gap: 4 },
  keyName: { color: COLORS.text, fontSize: 26, fontWeight: '800' },
  nameInput: {
    color: COLORS.text, fontSize: 24, fontWeight: '700',
    borderBottomWidth: 2, borderBottomColor: COLORS.accent, paddingVertical: 4,
  },
  date: { color: COLORS.muted, fontSize: 13 },
  section: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  confBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  confDot: { width: 7, height: 7, borderRadius: 4 },
  confLabel: { fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, width: '47%', gap: 4,
  },
  detailCardWide: { width: '100%' },
  detailIcon: { fontSize: 22 },
  detailLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginTop: 4 },
  detailValue: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  detailValueMono: { fontFamily: 'monospace', color: '#22c55e', fontSize: 18, fontWeight: '800' },
  aiNotes: {
    backgroundColor: '#1e3a2f', borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#22c55e',
  },
  aiNotesLabel: { color: '#86efac', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  aiNotesText: { color: '#d1fae5', fontSize: 13, lineHeight: 18 },
  notesInput: {
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 12,
    color: COLORS.text, fontSize: 14, borderWidth: 1, borderColor: COLORS.border, minHeight: 80,
  },
  notesText: { color: COLORS.muted, fontSize: 14, lineHeight: 20 },
  bittingViz: {
    margin: 16, backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  bittingVizTitle: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  bittingChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 80 },
  bittingColumn: { alignItems: 'center', gap: 4, flex: 1 },
  bittingBar: {
    width: '100%', backgroundColor: COLORS.accent, borderRadius: 4,
    minHeight: 10,
  },
  bittingNumber: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },
  actions: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 8,
  },
  editBtn: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  editBtnText: { color: COLORS.text, fontWeight: '600', fontSize: 15 },
  deleteBtn: {
    flex: 1, backgroundColor: '#3f1212',
    borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.danger,
  },
  deleteBtnText: { color: '#fca5a5', fontWeight: '600', fontSize: 15 },
  cancelBtn: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  cancelBtnText: { color: COLORS.muted, fontWeight: '600', fontSize: 15 },
  saveBtn: {
    flex: 2, backgroundColor: COLORS.accent,
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
