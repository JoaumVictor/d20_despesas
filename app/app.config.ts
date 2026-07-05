import type { ExpoConfig, ConfigContext } from 'expo/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require('./package.json');

/**
 * As variáveis sensíveis vêm do `.env` (URL, KEY, GOOGLE_WEB_CLIENT_ID) e são
 * repassadas ao app via `extra`. Assim mantemos os nomes curtos no .env e
 * validamos tudo em runtime com Zod (ver src/lib/env.ts).
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'D20 Despesas',
  slug: 'despesas',
  // Fonte única de verdade: package.json. Nunca mais desalinha da versão exibida no app.
  version,
  scheme: 'despesas',
  orientation: 'portrait',
  icon: './assets/d20_despesas.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
  },
  android: {
    package: 'com.victorfausto.despesas',
    adaptiveIcon: {
      // A máscara adaptativa do Android corta a borda do ícone — usa uma
      // versão com margem (não o d20_despesas.png cru) senão o desenho
      // aparece cortado/"com zoom".
      backgroundColor: '#01763B',
      foregroundImage: './assets/android-icon-foreground-padded.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/d20_despesas.png',
  },
  plugins: [
    'expo-router',
    '@react-native-google-signin/google-signin',
    [
      'expo-splash-screen',
      {
        image: './assets/d20_despesas.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#01763B',
        dark: {
          image: './assets/d20_despesas.png',
          backgroundColor: '#01763B',
        },
      },
    ],
    [
      'expo-notifications',
      {
        color: '#01763B',
      },
    ],
    'expo-sqlite',
  ],
  extra: {
    supabaseUrl: process.env.URL,
    supabaseAnonKey: process.env.KEY,
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
    eas: {
      projectId: 'c75c28f8-f4c6-428d-b086-1e56c63aef58',
    },
  },
  owner: 'victorfausto',
});
