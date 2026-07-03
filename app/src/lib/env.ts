import Constants from 'expo-constants';
import { z } from 'zod';

/**
 * Valida as variáveis de ambiente injetadas via app.config.ts (`extra`).
 * Falha cedo e com mensagem clara caso algo não esteja configurado no .env.
 */
const envSchema = z.object({
  supabaseUrl: z.string().url('URL do Supabase inválida (verifique URL no .env)'),
  supabaseAnonKey: z.string().min(1, 'KEY (anon key) ausente no .env'),
  googleWebClientId: z
    .string()
    .regex(
      /\.apps\.googleusercontent\.com$/,
      'GOOGLE_WEB_CLIENT_ID deve terminar com .apps.googleusercontent.com',
    ),
});

const parsed = envSchema.safeParse(Constants.expoConfig?.extra ?? {});

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `- ${i.message}`).join('\n');
  throw new Error(`Configuração de ambiente inválida:\n${issues}`);
}

export const env = parsed.data;

/** Schema do Postgres onde vivem as tabelas do app. */
export const DB_SCHEMA = 'd20_despesas' as const;
