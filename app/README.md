# Despesas — App de despesas pessoais

App React Native (Expo) para controle de despesas pessoais, com login via Google e dados no Supabase.

## Stack
- **Expo** (SDK 57) + **expo-router** (rotas em `src/app`)
- **Supabase** (Postgres + Auth) — schema `d20_despesas`
- **@tanstack/react-query** para dados/cache
- **Google Sign-In** nativo (`@react-native-google-signin`)
- **Zod** para validação de variáveis de ambiente

## Configuração

### 1. Variáveis de ambiente
Copie `.env.example` para `.env` e preencha:

```
URL=                  # Supabase URL
KEY=                  # Supabase anon key
DATABASE_PASSWORD=    # senha do Postgres (migrations)
DIRECT_CONNECTION=    # string de conexão direta (migrations)
GOOGLE_WEB_CLIENT_ID= # Web client do Google Cloud Console
```

### 2. Banco de dados
No painel do Supabase → **SQL Editor**, rode o conteúdo de
`supabase/migrations/0001_init.sql` (cria schema, tabelas, RLS e triggers).

Depois vá em **Settings → API → Exposed schemas** e adicione `d20_despesas`.

### 3. Autenticação Google
- **Supabase → Authentication → Providers → Google:** habilite e informe o client.
- **Android:** registre o SHA-1 do app no Google Cloud Console.

As 14 categorias padrão são criadas automaticamente no primeiro login.

## Rodando

```bash
npm install
npx expo start
```

## Estrutura
```
src/
  app/            # rotas (expo-router)
    (auth)/       # login
    (app)/        # área autenticada (lista + form de despesa)
  features/       # auth, expenses, categories
  lib/            # supabase, env, queryClient
  types/          # tipos do banco
  utils/          # formatação, uuid
supabase/
  migrations/     # SQL do schema
```
