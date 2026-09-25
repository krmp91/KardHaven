import { Query } from '@tcgdex/sdk';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
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
import { useLanguage } from '../../lib/i18n';
import { cardImageUrl, tcgdex } from '../../lib/tcgdex';
import { colors } from '../../lib/theme';

type CardBrief = { id: string; localId: string; name: string; image?: string };

const PAGE_SIZE = 20;

function ResultThumb({ image }: { image?: string }) {
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    return <View style={styles.thumb} />;
  }

  return (
    <Image
      source={{ uri: cardImageUrl(image, 'low') }}
      style={styles.thumb}
      onError={() => setFailed(true)}
    />
  );
}

export default function Search() {
  const router = useRouter();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [number, setNumber] = useState('');
  const [results, setResults] = useState<CardBrief[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  // Synchronous guard: onEndReached can fire again before the `loadingMore` state
  // update lands, letting two concurrent calls race and fetch/append the same page.
  const loadingMoreRef = useRef(false);

  const buildQuery = (targetPage: number) => {
    let q = Query.create().contains('name', query.trim()).paginate(targetPage, PAGE_SIZE);
    const trimmedNumber = number.trim();
    if (trimmedNumber) {
      // TCGdex's API doesn't support exact-match (`eq:`) on localId — it returns
      // empty even for real cards. Partial match works and is close enough since
      // the number is shown next to each result anyway.
      q = q.contains('localId', trimmedNumber);
    }
    return q;
  };

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    loadingMoreRef.current = false;
    try {
      const cards = ((await tcgdex.card.list(buildQuery(1))) as CardBrief[]) ?? [];
      setResults(cards);
      setPage(1);
      setHasMore(cards.length === PAGE_SIZE);
    } catch {
      setError(t('search.failed'));
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const loadMore = async () => {
    if (loadingMoreRef.current || !hasMore || loading) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const cards = ((await tcgdex.card.list(buildQuery(nextPage))) as CardBrief[]) ?? [];
      setResults((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...cards.filter((c) => !seen.has(c.id))];
      });
      setPage(nextPage);
      setHasMore(cards.length === PAGE_SIZE);
    } catch {
      // Silently stop paginating on error; the user already has results shown.
      setHasMore(false);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.input, styles.nameInput]}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TextInput
          style={[styles.input, styles.numberInput]}
          placeholder={t('search.numberPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={number}
          onChangeText={setNumber}
          onSubmitEditing={handleSearch}
          autoCapitalize="characters"
          returnKeyType="search"
        />
        <Pressable style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>{t('search.button')}</Text>
        </Pressable>
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={styles.loading} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        renderItem={({ item }) => (
          <Pressable style={styles.resultRow} onPress={() => router.push(`/card/${item.id}`)}>
            <ResultThumb image={item.image} />
            <Text style={styles.resultName}>{item.name}</Text>
            <Text style={styles.resultNumber}>#{item.localId}</Text>
          </Pressable>
        )}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} /> : null}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.hint}>{searched ? t('search.noResults') : t('search.prompt')}</Text>
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
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  nameInput: {
    flex: 1,
  },
  numberInput: {
    width: 64,
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
    flex: 1,
  },
  resultNumber: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
