import { Query } from '@tcgdex/sdk';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { cardImageUrl, tcgdex } from '../../lib/tcgdex';
import { colors } from '../../lib/theme';

type CardBrief = { id: string; localId: string; name: string; image?: string };

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CardBrief[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const cards = await tcgdex.card.list(Query.create().contains('name', trimmed).paginate(1, 20));
      setResults((cards as CardBrief[]) ?? []);
    } catch {
      setError('Søgningen fejlede. Prøv igen.');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Søg efter et kort..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Pressable style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Søg</Text>
        </Pressable>
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={styles.loading} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.resultRow} onPress={() => router.push(`/card/${item.id}`)}>
            {item.image ? (
              <Image source={{ uri: cardImageUrl(item.image, 'low') }} style={styles.thumb} />
            ) : (
              <View style={styles.thumb} />
            )}
            <Text style={styles.resultName}>{item.name}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.hint}>
              {searched ? 'Ingen kort fundet.' : 'Søg efter et Pokémon-kort ovenfor.'}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: colors.onAccent,
    fontWeight: '700',
  },
  loading: {
    marginTop: 16,
  },
  error: {
    color: colors.warning,
    marginTop: 12,
    textAlign: 'center',
  },
  hint: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 32,
  },
  list: {
    paddingVertical: 16,
    gap: 10,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 8,
  },
  thumb: {
    width: 44,
    height: 61,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  resultName: {
    color: colors.text,
    fontSize: 15,
    flexShrink: 1,
  },
});
