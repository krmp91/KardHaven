import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CARD_CONDITIONS, CARD_LANGUAGES, CardCondition, CardFinish, CardLanguage } from '../../lib/catalog';
import { useLanguage } from '../../lib/i18n';
import { supabase } from '../../lib/supabase';
import { cardImageUrl } from '../../lib/tcgdex';
import { colors } from '../../lib/theme';

const FINISHES: CardFinish[] = ['normal', 'holo', 'reverse_holo', 'other'];

type CollectionItemDetail = {
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

export default function EditCollectionItem() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();

  const [item, setItem] = useState<CollectionItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [finish, setFinish] = useState<CardFinish>('normal');
  const [condition, setCondition] = useState<CardCondition | null>(null);
  const [cardLanguage, setCardLanguage] = useState<CardLanguage>('EN');
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('collection_items')
        .select('id, quantity, variant, condition, language, cards(name, image_url, sets(name))')
        .eq('id', id)
        .single();

      if (cancelled) return;
      if (fetchError || !data) {
        setError(t('collection.notFound'));
      } else {
        const fetched = data as unknown as CollectionItemDetail;
        setItem(fetched);
        setFinish(fetched.variant);
        setCondition(fetched.condition);
        setCardLanguage(fetched.language);
        setQuantity(fetched.quantity);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? t('collection.notFound')}</Text>
      </View>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    const { error: updateError } = await supabase
      .from('collection_items')
      .update({ variant: finish, condition, language: cardLanguage, quantity })
      .eq('id', id);
    setSaving(false);

    if (updateError) {
      console.error('collection_items update error:', updateError);
      Alert.alert(t('collection.saveError'));
      return;
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(t('collection.deleteConfirmTitle'), t('collection.deleteConfirmMessage'), [
      { text: t('collection.deleteConfirmCancel'), style: 'cancel' },
      {
        text: t('collection.deleteConfirmConfirm'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          const { error: deleteError } = await supabase
            .from('collection_items')
            .delete()
            .eq('id', id);
          setDeleting(false);

          if (deleteError) {
            console.error('collection_items delete error:', deleteError);
            Alert.alert(t('collection.deleteError'));
            return;
          }
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {item.cards?.image_url ? (
        <Image
          source={{ uri: cardImageUrl(item.cards.image_url, 'high') }}
          style={styles.image}
          resizeMode="contain"
        />
      ) : null}

      <Text style={styles.name}>{item.cards?.name ?? t('collection.unknownCard')}</Text>
      {item.cards?.sets?.name && <Text style={styles.setName}>{item.cards.sets.name}</Text>}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('card.variantLabel')}</Text>
        <View style={styles.chipRow}>
          {FINISHES.map((f) => (
            <Pressable
              key={f}
              style={[styles.chip, finish === f && styles.chipActive]}
              onPress={() => setFinish(f)}
            >
              <Text style={[styles.chipText, finish === f && styles.chipTextActive]}>
                {t(`finish.${f}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('card.languageLabel')}</Text>
        <View style={styles.chipRow}>
          {CARD_LANGUAGES.map((l) => (
            <Pressable
              key={l}
              style={[styles.chip, cardLanguage === l && styles.chipActive]}
              onPress={() => setCardLanguage(l)}
            >
              <Text style={[styles.chipText, cardLanguage === l && styles.chipTextActive]}>{l}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('collection.conditionLabel')}</Text>
        <View style={styles.chipRow}>
          {CARD_CONDITIONS.map((c) => (
            <Pressable
              key={c}
              style={[styles.chip, condition === c && styles.chipActive]}
              onPress={() => setCondition(condition === c ? null : c)}
            >
              <Text style={[styles.chipText, condition === c && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('card.quantityLabel')}</Text>
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

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving || deleting}>
        {saving ? (
          <ActivityIndicator color={colors.onAccent} />
        ) : (
          <Text style={styles.saveButtonText}>{t('collection.saveButton')}</Text>
        )}
      </Pressable>

      <Pressable style={styles.deleteButton} onPress={handleDelete} disabled={saving || deleting}>
        {deleting ? (
          <ActivityIndicator color={colors.warning} />
        ) : (
          <Text style={styles.deleteButtonText}>{t('collection.deleteButton')}</Text>
        )}
      </Pressable>
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
    width: '60%',
    aspectRatio: 5 / 7,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  setName: {
    color: colors.textMuted,
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
  saveButton: {
    marginTop: 20,
    width: '100%',
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.onAccent,
    fontWeight: '700',
  },
  deleteButton: {
    marginTop: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.warning,
    fontWeight: '700',
  },
  error: {
    color: colors.warning,
    textAlign: 'center',
  },
});
