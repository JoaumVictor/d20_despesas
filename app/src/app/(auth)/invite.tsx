import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { radius, shadowFloating, spacing, type } from '@/theme/tokens';

/**
 * Tela exibida só pra contas Google novas (que nunca resgataram um código de
 * convite). Contas que já usam o app passam direto por aqui — ver
 * AuthContext.needsInviteCode / RootNavigator.
 */
export default function InviteScreen() {
  const { signOut, markInviteRedeemed } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  async function handleConfirm() {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('redeem_invite_code', {
        p_code: code,
      });
      if (rpcError) throw rpcError;
      if (!data) {
        setError('Código inválido ou já utilizado. Tente outro código.');
        return;
      }
      markInviteRedeemed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível validar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <LinearGradient
      colors={['#01361D', '#01763B', '#012616']}
      locations={[0, 0.55, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>Falta pouco!</Text>
          <Text style={styles.subtitle}>
            Sua conta Google é nova por aqui. O D20 Despesas é por convite — insira o código que
            você recebeu pra continuar.
          </Text>
        </View>

        <View style={styles.footer}>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(t) => {
              setCode(t);
              if (error) setError(null);
            }}
            placeholder="Código de convite"
            placeholderTextColor="rgba(255,255,255,0.5)"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              shadowFloating,
              pressed && { opacity: 0.9 },
              !code.trim() && { opacity: 0.5 },
            ]}
            onPress={handleConfirm}
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#111B14" />
            ) : (
              <Text style={styles.confirmText}>Confirmar código</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            onPress={handleCancel}
            disabled={signingOut}
          >
            {signingOut ? (
              <ActivityIndicator color="rgba(255,255,255,0.85)" />
            ) : (
              <Text style={styles.cancelLink}>Cancelar e sair</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: 'space-between', padding: spacing.xxl },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  title: { ...type.display, color: '#FFFFFF' },
  subtitle: {
    ...type.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  footer: { gap: spacing.md, paddingBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 15,
    color: '#FFFFFF',
    fontSize: 16,
  },
  error: { ...type.caption, color: '#FF9B9B', fontWeight: '700' },
  confirmBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  confirmText: { ...type.bodyBold, fontSize: 16, color: '#111B14' },
  cancelLink: {
    ...type.bodyBold,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
});
