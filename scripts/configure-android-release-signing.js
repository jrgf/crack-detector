const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
let source = fs.readFileSync(buildGradlePath, 'utf8');

const releaseSigningConfig = `        release {
            def releaseStoreFile = System.getenv("ANDROID_KEYSTORE_PATH")
            def releaseStorePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
            def releaseKeyAlias = System.getenv("ANDROID_KEY_ALIAS")
            def releaseKeyPassword = System.getenv("ANDROID_KEY_PASSWORD")

            if (releaseStoreFile && releaseStorePassword && releaseKeyAlias && releaseKeyPassword) {
                storeFile file(releaseStoreFile)
                storePassword releaseStorePassword
                keyAlias releaseKeyAlias
                keyPassword releaseKeyPassword
            } else {
                storeFile file('debug.keystore')
                storePassword 'android'
                keyAlias 'androiddebugkey'
                keyPassword 'android'
            }
        }`;

if (!source.includes('System.getenv("ANDROID_KEYSTORE_PATH")')) {
  source = source.replace(
    /(signingConfigs\s*\{\s*debug\s*\{[\s\S]*?\n\s*}\n)(\s*)}/,
    `$1${releaseSigningConfig}\n$2}`
  );
}

source = source.replace(
  /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
  '$1signingConfig signingConfigs.release'
);

fs.writeFileSync(buildGradlePath, source);
