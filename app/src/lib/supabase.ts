import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { DB_SCHEMA, env } from './env';
import type { Database } from '@/types/database';

/**
 * Client do Supabase.
 * - `db.schema`: aponta as queries para o schema d20_despesas.
 * - `auth.storage`: persiste a sessão no AsyncStorage (mobile).
 * - `detectSessionInUrl: false`: não estamos em ambiente web com redirect.
 */
export const supabase = createClient<Database, 'd20_despesas'>(env.supabaseUrl, env.supabaseAnonKey, {
  db: { schema: DB_SCHEMA },
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
