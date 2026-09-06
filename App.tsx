import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from './lib/supabase';

export default function App() {
  const [status, setStatus] = useState('Connecting to Supabase...');

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ error }) => {
        setStatus(error ? `Connection error: ${error.message}` : 'Connected to Supabase ✅');
      })
      .catch((err) => setStatus(`Connection error: ${err.message}`));
  }, []);

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Text style={styles.status}>{status}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    marginTop: 12,
    fontWeight: '600',
  },
});
