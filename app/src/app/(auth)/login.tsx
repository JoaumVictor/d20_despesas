import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/theme/useTheme';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const c = useTheme();

  async function handleLogin() {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      Alert.alert('Erro ao entrar', err instanceof Error ? err.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.hero}>
        <MaterialCommunityIcons name="wallet-outline" size={72} color={c.primary} />
        <Text style={[styles.title, { color: c.text }]}>Despesas</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>
          Controle suas despesas pessoais de forma simples.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: c.primary },
          pressed && styles.buttonPressed,
        ]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={c.primaryContrast} />
        ) : (
          <>
            <MaterialCommunityIcons name="google" size={20} color={c.primaryContrast} />
            <Text style={[styles.buttonText, { color: c.primaryContrast }]}>Entrar com Google</Text>
          </>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', padding: 24 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 34, fontWeight: '800' },
  subtitle: { fontSize: 16, textAlign: 'center', maxWidth: 280 },
  button: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
