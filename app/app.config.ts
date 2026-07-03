import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * As variáveis sensíveis vêm do `.env` (URL, KEY, GOOGLE_WEB_CLIENT_ID) e são
 * repassadas ao app via `extra`. Assim mantemos os nomes curtos no .env e
 * validamos tudo em runtime com Zod (ver src/lib/env.ts).
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Despesas',
  slug: 'despesas',
  version: '1.0.0',
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
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/d20_despesas.png',
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
        backgroundColor: '#E6F4FE',
        dark: {
          image: './assets/d20_despesas.png',
          backgroundColor: '#0B1220',
        },
      },
    ],
  ],
  extra: {
    supabaseUrl: process.env.URL,
    supabaseAnonKey: process.env.KEY,
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
  },
});
