import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { AuthProvider } from '../lib/AuthProvider';
import { colors } from '../lib/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="card/[id]"
          options={{
            headerShown: true,
            title: '',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </AuthProvider>
  );
}
