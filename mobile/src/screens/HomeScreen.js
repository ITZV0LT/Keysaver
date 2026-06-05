import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, RefreshControl, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllKeys, deleteKey } from '../services/storage';
import KeyCard from '../components/KeyCard';

const COLORS = {
  bg: '#0f172a',
  surface: '#1e293b',
  accent: '#6366f1',
  text: '#f1f5f9',
  muted: '#94a3b8',
  border: '#334155',
  danger: '#ef4444',
};

export default function HomeScreen({ navigation }) {
  const [keys, setKeys] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadKeys = useCallback(async () => {
    const data = await getAllKeys();
    setKeys(data);
    filterKeys(data, search);
  }, [search]);

  useFocusEffect(useCallback(() => { loadKeys(); }, [loadKeys]));

  function filterKeys(data, query) {
    if (!query.trim()) {
      setFiltered(data);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(data.filter(k =>
      (k.name || '').toLowerCase().includes(q) ||
      (k.analysis?.keyType || '').toLowerCase().includes(q) ||
      (k.analysis?.keyway || '').toLowerCase().includes(q) ||
      (k.analysis?.bitting || '').toLowerCase().includes(q)
    ));
  }

  function handleSearch(text) {
    setSearch(text);
    filterKeys(keys, text);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadKeys();
    setRefreshing(false);
  }

  function handleDelete(id) {
    Alert.alert('Delete Key', 'Remove this key from KeySaver?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteKey(id);
          loadKeys();
        },
      },
    ]);
  }

  function renderEmpty() {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🔑</Text>
        <Text style={styles.emptyTitle}>No keys saved yet</Text>
        <Text style={styles.emptyText}>
          Tap the Scan tab below to photograph and analyze a key
        </Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => navigation.navigate('Add')}
        >
          <Text style={styles.emptyBtnText}>Scan a Key</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search keys..."
          placeholderTextColor={COLORS.muted}
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Text style={{ color: COLORS.muted, fontSize: 16, paddingHorizontal: 8 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {keys.length > 0 && (
        <Text style={styles.count}>
          {filtered.length} of {keys.length} key{keys.length !== 1 ? 's' : ''}
        </Text>
      )}

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <KeyCard
            keyData={item}
            onPress={() => navigation.navigate('KeyDetail', { keyId: item.id })}
            onLongPress={() => handleDelete(item.id)}
          />
        )}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent}
          />
        }
        contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: 10,
  },
  count: {
    color: COLORS.muted,
    fontSize: 12,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
