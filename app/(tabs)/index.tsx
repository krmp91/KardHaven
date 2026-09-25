import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type CardCondition, type CardFinish, type CardLanguage } from '../../lib/catalog';
import { useLanguage } from '../../lib/i18n';
import { supabase } from '../../lib/supabase';
import { cardImageUrl } from '../../lib/tcgdex';
import { colors } from '../../lib/theme';

type CollectionItem = {
  id: string;
  quantity: number;
  variant: CardFinish;
  condition: CardCondition | null;
  language: CardLanguage;
  cards: {
    name: string;
    image_url: string | null;
    sets: { name: string } | null;
  } | null;
};

export default function Collection() {
  const { t } = useLanguage();
  const router = useRouter();
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('collection_items')
      .select('id, quantity, variant, condition, language, cards(name, image_url, sets(name))')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(t('collection.loadError'));
    } else {
      setError(null);
      setItems((data as unknown as CollectionItem[]) ?? []);
    }
    setLoading(false);
    setRefreshing(false);
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/collection/${item.id}`)}>
            {item.cards?.image_url ? (
              <Image
                source={{ uri: cardImageUrl(item.cards.image_url, 'low') }}
                style={styles.thumb}
              />
            ) : (
              <View style={styles.thumb} />
            )}
            <View style={styles.info}>
              <Text style={styles.name}>{item.cards?.name ?? t('collection.unknownCard')}</Text>
              <Text style={styles.meta}>{item.cards?.sets?.name}</Text>
              <View style={styles.badgeRow}>
                <Text style={styles.badge}>{item.language}</Text>
                <Text style={styles.badge}>{t(`finish.${item.variant}`)}</Text>
                {item.condition && <Text style={styles.badge}>{item.condition}</Text>}
                <Text style={styles.badge}>×{item.quantity}</Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.hint}>{t('collection.empty')}</Text>}
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
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: colors.warning,
    textAlign: 'center',
    marginBottom: 8,
  },
  list: {
    paddingVertical: 8,
    gap: 10,
  },
  row: {
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
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  badge: {
    color: colors.text,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
  },
  hint: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 32,
  },
});
