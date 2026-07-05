import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { LOCAL_USER_ID, resetLocalDb } from './localDb';

const FLAG_KEY = 'd20-local-mode';

export async function isLocalModeEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(FLAG_KEY)) === '1';
}

export async function enableLocalMode(): Promise<void> {
  await AsyncStorage.setItem(FLAG_KEY, '1');
}

/**
 * Sai do modo local SEM apagar nada: os dados continuam salvos no SQLite do
 * aparelho e reaparecem se a pessoa escolher "Usar sem conta" de novo depois.
 */
export async function leaveLocalMode(): Promise<void> {
  await AsyncStorage.removeItem(FLAG_KEY);
}

/** Sai do modo local e APAGA todos os dados do perfil (irreversível). */
export async function exitLocalMode(): Promise<void> {
  await resetLocalDb();
  await AsyncStorage.removeItem(FLAG_KEY);
}

/**
 * Sessão "de mentirinha" com o shape mínimo usado pelo resto do app
 * (`session.user.id`, `.email`, `.user_metadata`, `.app_metadata`), pra que
 * telas e hooks que já leem esses campos funcionem sem nenhuma alteração.
 */
export function buildLocalSession(): Session {
  return {
    access_token: 'local',
    refresh_token: 'local',
    expires_in: 0,
    token_type: 'bearer',
    user: {
      id: LOCAL_USER_ID,
      app_metadata: { provider: 'local' },
      user_metadata: { full_name: 'Perfil local' },
      aud: 'authenticated',
      created_at: '',
      email: undefined,
    },
  } as unknown as Session;
}
