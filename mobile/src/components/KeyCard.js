import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const COLORS = {
  surface: '#1e293b',
  accent: '#6366f1',
  text: '#f1f5f9',
  muted: '#94a3b8',
  border: '#334155',
};

export default function KeyCard({ keyData, onPress, onLongPress }) {
  const confidence = keyData.analysis?.confidence || 'unknown';
  const confColor =
    confidence === 'high' ? '#22c55e' :
    confidence === 'medium' ? '#f59e0b' : '#94a3b8';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
    >
      <View style={styles.imageContainer}>
        {keyData.imageUri ? (
          <Image source={{ uri: keyData.imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={{ fontSize: 32 }}>🔑</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {keyData.name || 'Unnamed Key'}
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {keyData.analysis?.keyType || 'Unknown type'}
        </Text>
        {keyData.analysis?.keyway && (
          <Text style={styles.keyway} numberOfLines={1}>
            Keyway: {keyData.analysis.keyway}
          </Text>
        )}
        {keyData.analysis?.bitting && (
          <View style={styles.bittingRow}>
            <Text style={styles.bittingLabel}>Bitting: </Text>
            <Text style={styles.bitting}>{keyData.analysis.bitting}</Text>
          </View>
        )}
      </View>

      <View style={styles.right}>
        <View style={[styles.confidenceDot, { backgroundColor: confColor }]} />
        <Text style={styles.date}>
          {new Date(keyData.createdAt).toLocaleDateString()}
        </Text>
        <Text style={{ fontSize: 16, color: COLORS.muted }}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 12,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  detail: {
    color: COLORS.muted,
    fontSize: 13,
  },
  keyway: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  bittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  bittingLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  bitting: {
    color: '#22c55e',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  right: {
    alignItems: 'center',
    gap: 4,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  date: {
    color: COLORS.muted,
    fontSize: 11,
  },
});
