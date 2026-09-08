import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../lib/AuthProvider';
import { colors } from '../../lib/theme';

export default function Profile() {
  const { session, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.email}>{session?.user.email}</Text>
      <Pressable style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Log ud</Text>
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
    gap: 16,
    paddingHorizontal: 32,
  },
  email: {
    color: colors.text,
    fontSize: 16,
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
