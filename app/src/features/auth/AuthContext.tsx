import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { env } from '@/lib/env';
import {
  buildLocalSession,
  enableLocalMode,
  exitLocalMode,
  isLocalModeEnabled,
  leaveLocalMode,
} from '@/lib/localMode';
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
  /** true = perfil 100% local (SQLite no aparelho), sem nenhum contato com o Supabase. */
  isLocal: boolean;
  signInWithGoogle: () => Promise<void>;
  /** Entra no modo local: nenhuma conta, nenhuma chamada de rede, dados só no aparelho. */
  enterLocalMode: () => Promise<void>;
  /** Sai do modo local SEM apagar dados — volta pro login, dados continuam salvos. */
  leaveLocalMode: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isLocal, setIsLocal] = useState(false);
  // espelha `isLocal` sem closure velha — o listener abaixo é registrado uma
  // única vez (mount) e precisa sempre ler o valor mais recente.
  const isLocalRef = useRef(false);

  function setLocal(value: boolean) {
    isLocalRef.current = value;
    setIsLocal(value);
  }

  useEffect(() => {
    configureGoogleSignin();
  }, []);

  useEffect(() => {
    // Sempre assina o listener — é só um callback local, não faz chamada de
    // rede sozinho. Isso é o que garante que um login com Google feito DEPOIS
    // de já ter passado pelo modo local (nesta mesma sessão do app) ainda
    // atualiza a sessão — antes, esse listener só era assinado quando o app
    // abria fora do modo local, então nunca mais disparava depois de entrar
    // e sair do modo local uma vez.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (isLocalRef.current) return; // perfil local ativo: ignora eventos do Supabase
      setSession(next);
    });

    (async () => {
      const local = await isLocalModeEnabled();
      if (local) {
        // Modo local: nunca chama o Supabase, nem getSession.
        setLocal(true);
        setSession(buildLocalSession());
        setInitializing(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setInitializing(false);
    })();

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

  const enterLocalMode = useCallback(async () => {
    await enableLocalMode();
    setLocal(true);
    setSession(buildLocalSession());
  }, []);

  const leaveLocalModeCb = useCallback(async () => {
    await leaveLocalMode();
    setLocal(false);
    setSession(null);
  }, []);

  const signOut = useCallback(async () => {
    if (isLocal) {
      await exitLocalMode();
      setLocal(false);
      setSession(null);
      return;
    }
    await googleSignin?.GoogleSignin.signOut().catch(() => undefined);
    await supabase.auth.signOut();
  }, [isLocal]);

  const value = useMemo(
    () => ({
      session,
      initializing,
      isLocal,
      signInWithGoogle,
      enterLocalMode,
      leaveLocalMode: leaveLocalModeCb,
      signOut,
    }),
    [session, initializing, isLocal, signInWithGoogle, enterLocalMode, leaveLocalModeCb, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
