import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../lib/AuthProvider';
import { colors } from '../lib/theme';

export default function Login() {
  const { session, loading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/" />;
  }

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const result = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else if (mode === 'signUp') {
      setError('Check your email to confirm your account, then sign in.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KardHaven</Text>
      <Text style={styles.subtitle}>{mode === 'signIn' ? 'Log ind' : 'Opret bruger'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={colors.onAccent} />
        ) : (
          <Text style={styles.buttonText}>{mode === 'signIn' ? 'Log ind' : 'Opret bruger'}</Text>
        )}
      </Pressable>

      <Text
        style={styles.link}
        onPress={() => {
          setError(null);
          setMode(mode === 'signIn' ? 'signUp' : 'signIn');
        }}
      >
        {mode === 'signIn' ? 'Ny bruger? Opret konto' : 'Har du allerede en konto? Log ind'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
    marginBottom: 12,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: colors.onAccent,
    fontWeight: '700',
  },
  error: {
    color: colors.warning,
    textAlign: 'center',
  },
  link: {
    marginTop: 16,
    color: colors.favorite,
  },
});
