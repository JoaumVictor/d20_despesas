import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

/**
 * Carrega o `@react-native-google-signin/google-signin` de forma tolerante.
 *
 * A lib chama `TurboModuleRegistry.getEnforcing('RNGoogleSignin')` já na
 * avaliação do módulo, o que ESTOURA no import quando o módulo nativo não está
 * no binário — caso do **Expo Go**. Um import estático derrubaria toda a árvore
 * de rotas do expo-router. Com o `require` protegido, o app abre normalmente e o
 * login apenas fica indisponível (exige um development build: `expo run:android`).
 */
type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

let googleSignin: GoogleSigninModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  googleSignin = require('@react-native-google-signin/google-signin');
} catch {
  googleSignin = null;
}

const GOOGLE_UNAVAILABLE_MSG =
  'Google Sign-In indisponível neste app. Rode um development build ' +
  '(npx expo run:android) — o Expo Go não inclui o módulo nativo.';

function configureGoogleSignin() {
  if (!googleSignin) {
    console.warn(`[auth] ${GOOGLE_UNAVAILABLE_MSG}`);
    return;
  }
  googleSignin.GoogleSignin.configure({
    webClientId: env.googleWebClientId,
    offlineAccess: false,
  });
}

interface AuthContextValue {
  session: Session | null;
  initializing: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    configureGoogleSignin();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!googleSignin) {
      throw new Error(GOOGLE_UNAVAILABLE_MSG);
    }
    const { GoogleSignin, statusCodes, isErrorWithCode } = googleSignin;
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) {
        throw new Error('Não foi possível obter o token do Google.');
      }
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) throw error;
    } catch (err) {
      if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
        return; // usuário cancelou, não é erro
      }
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    await googleSignin?.GoogleSignin.signOut().catch(() => undefined);
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, initializing, signInWithGoogle, signOut }),
    [session, initializing, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
