import Constants from 'expo-constants';

/** Versão do app — vem de `package.json` (repassada via app.config.ts). */
export const appVersion = Constants.expoConfig?.version ?? '';
