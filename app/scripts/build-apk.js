#!/usr/bin/env node
/**
 * Gera um APK de release assinado com a debug keystore — suficiente pra
 * instalar em qualquer aparelho manualmente (compartilhar o arquivo, sideload
 * via adb, etc). Não serve pra publicar na Play Store (precisaria de uma
 * keystore de produção de verdade).
 *
 * Uso: `npm run apk` ou `yarn apk`.
 */
const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const root = path.resolve(__dirname, '..');
const androidDir = path.join(root, 'android');
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

console.log('› Sincronizando projeto nativo (expo prebuild)...\n');
execSync('npx expo prebuild --platform android', { stdio: 'inherit', cwd: root });

console.log('\n› Gerando APK de release (gradlew assembleRelease)...\n');
execSync(`${gradlew} assembleRelease`, { stdio: 'inherit', cwd: androidDir, shell: true });

const apkPath = path.join(
  androidDir,
  'app',
  'build',
  'outputs',
  'apk',
  'release',
  'app-release.apk',
);

if (fs.existsSync(apkPath)) {
  const { version } = require(path.join(root, 'package.json'));
  console.log(`\n✅ APK gerado (versão ${version}):\n${apkPath}\n`);
} else {
  console.warn('\n⚠️  O build terminou mas o APK não foi encontrado no caminho esperado.');
  process.exitCode = 1;
}
