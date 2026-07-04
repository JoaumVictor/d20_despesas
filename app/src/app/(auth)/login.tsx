import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthContext';
import { radius, shadowFloating, spacing, type } from '@/theme/tokens';

const GOOGLE_BLUE = '#4285F4';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

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
    <LinearGradient
      colors={['#01361D', '#01763B', '#012616']}
      locations={[0, 0.55, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <View style={[styles.logoCard, shadowFloating]}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>D20 Despesas</Text>
          <Text style={styles.tagline}>
            Suas finanças no controle,{'\n'}um dado de cada vez.
          </Text>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.googleBtn,
              shadowFloating,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#111B14" />
            ) : (
              <>
                <MaterialCommunityIcons name="google" size={22} color={GOOGLE_BLUE} />
                <Text style={styles.googleText}>Continuar com Google</Text>
              </>
            )}
          </Pressable>
          <Text style={styles.privacy}>
            Seus dados ficam apenas na sua conta, protegidos por login.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: 'space-between', padding: spacing.xxl },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  logoCard: {
    width: 148,
    height: 148,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logo: { width: 128, height: 128, borderRadius: radius.pill },
  appName: { ...type.display, color: '#FFFFFF' },
  tagline: {
    ...type.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: { gap: spacing.lg, paddingBottom: spacing.sm },
  googleBtn: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: radius.lg,
  },
  googleText: { ...type.bodyBold, fontSize: 16, color: '#111B14' },
  privacy: {
    ...type.caption,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});
