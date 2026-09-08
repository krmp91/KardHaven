import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

export function PlaceholderScreen({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
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
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
