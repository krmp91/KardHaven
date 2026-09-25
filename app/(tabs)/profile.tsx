import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../lib/AuthProvider';
import { useLanguage } from '../../lib/i18n';
import { colors } from '../../lib/theme';

export default function Profile() {
  const { session, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.email}>{session?.user.email}</Text>

      <View style={styles.languageSection}>
        <Text style={styles.languageLabel}>{t('profile.language')}</Text>
        <View style={styles.languageRow}>
          <Pressable
            style={[styles.languageChip, language === 'da' && styles.languageChipActive]}
            onPress={() => setLanguage('da')}
          >
            <Text style={[styles.languageChipText, language === 'da' && styles.languageChipTextActive]}>
              Dansk
            </Text>
          </Pressable>
          <Pressable
            style={[styles.languageChip, language === 'en' && styles.languageChipActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.languageChipText, language === 'en' && styles.languageChipTextActive]}>
              English
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>{t('profile.signOut')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 32,
  },
  email: {
    color: colors.text,
    fontSize: 16,
  },
  languageSection: {
    alignItems: 'center',
    gap: 8,
  },
  languageLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  languageChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  languageChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  languageChipText: {
    color: colors.text,
  },
  languageChipTextActive: {
    color: colors.onAccent,
    fontWeight: '700',
  },
  button: {
    backgroundColor: colors.warning,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: colors.onAccent,
    fontWeight: '700',
  },
});
