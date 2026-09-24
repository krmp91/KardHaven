import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../lib/AuthProvider';
import { supabase } from '../../lib/supabase';
import { cardImageUrl, tcgdex } from '../../lib/tcgdex';
import { colors } from '../../lib/theme';

type CardFinish = 'normal' | 'holo' | 'reverse_holo' | 'other';

type TCGdexCard = {
  id: string;
  name: string;
  image?: string;
  rarity?: string;
  localId?: string;
  types?: string[];
  hp?: number;
  set: {
    id: string;
    name: string;
    logo?: string;
    symbol?: string;
    cardCount?: { official?: number; total?: number };
  };
  variants?: {
    normal?: boolean;
    holo?: boolean;
    reverse?: boolean;
    firstEdition?: boolean;
    wPromo?: boolean;
  };
};

const FINISH_LABELS: Record<CardFinish, string> = {
  normal: 'Normal',
  holo: 'Holo',
  reverse_holo: 'Reverse holo',
  other: 'Andet',
};

function availableFinishes(variants: TCGdexCard['variants']): CardFinish[] {
  if (!variants) return ['normal'];
  const finishes: CardFinish[] = [];
  if (variants.normal) finishes.push('normal');
  if (variants.holo) finishes.push('holo');
  if (variants.reverse) finishes.push('reverse_holo');
  if (finishes.length === 0) finishes.push('other');
  return finishes;
}

export default function CardDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();

  const [card, setCard] = useState<TCGdexCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [finish, setFinish] = useState<CardFinish>('normal');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState<'ok' | 'error' | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    tcgdex.card
      .get(id)
      .then((result) => {
        if (cancelled) return;
        const fetched = result as unknown as TCGdexCard;
        setCard(fetched);
        setFinish(availableFinishes(fetched.variants)[0]);
      })
      .catch(() => {
        if (!cancelled) setError('Kunne ikke hente kortet.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const finishes = useMemo(() => availableFinishes(card?.variants), [card]);

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !card) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? 'Kortet blev ikke fundet.'}</Text>
      </View>
    );
  }

  const handleAdd = async () => {
    setAdding(true);
    setAddResult(null);

    const { error: syncError } = await supabase.functions.invoke('sync-card', {
      body: { cardId: card.id },
    });

    if (syncError) {
      setAdding(false);
      setAddResult('error');
      return;
    }

    const { error: insertError } = await supabase.from('collection_items').insert({
      card_id: card.id,
      quantity,
      variant: finish,
      language: 'EN',
    });

    setAdding(false);
    setAddResult(insertError ? 'error' : 'ok');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {card.image && (
        <Image source={{ uri: cardImageUrl(card.image, 'high') }} style={styles.image} resizeMode="contain" />
      )}

      <Text style={styles.name}>{card.name}</Text>
      <Text style={styles.setName}>
        {card.set.name} · #{card.localId}
      </Text>
      {card.rarity && <Text style={styles.rarity}>{card.rarity}</Text>}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Variant</Text>
        <View style={styles.chipRow}>
          {finishes.map((f) => (
            <Pressable
              key={f}
              style={[styles.chip, finish === f && styles.chipActive]}
              onPress={() => setFinish(f)}
            >
              <Text style={[styles.chipText, finish === f && styles.chipTextActive]}>
                {FINISH_LABELS[f]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Antal</Text>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepperButton}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={styles.stepperButtonText}>−</Text>
          </Pressable>
          <Text style={styles.stepperValue}>{quantity}</Text>
          <Pressable style={styles.stepperButton} onPress={() => setQuantity((q) => q + 1)}>
            <Text style={styles.stepperButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.addButton} onPress={handleAdd} disabled={adding}>
        {adding ? (
          <ActivityIndicator color={colors.onAccent} />
        ) : (
          <Text style={styles.addButtonText}>Tilføj til samling</Text>
        )}
      </Pressable>

      {addResult === 'ok' && <Text style={styles.success}>Tilføjet til din samling ✅</Text>}
      {addResult === 'error' && <Text style={styles.error}>Noget gik galt. Prøv igen.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  image: {
    width: '80%',
    aspectRatio: 5 / 7,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  setName: {
    color: colors.textMuted,
  },
  rarity: {
    color: colors.favorite,
    fontWeight: '600',
  },
  section: {
    width: '100%',
    marginTop: 12,
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
  },
  chipTextActive: {
    color: colors.onAccent,
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  stepperValue: {
    color: colors.text,
    fontSize: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  addButton: {
    marginTop: 20,
    width: '100%',
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.onAccent,
    fontWeight: '700',
  },
  success: {
    color: colors.success,
    fontWeight: '600',
  },
  error: {
    color: colors.warning,
    textAlign: 'center',
  },
});
