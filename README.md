# Crack Detector

Mobile app for on-device structural crack classification. It runs an EfficientNet-B0 model locally with `react-native-fast-tflite`, so photos are classified without a server or internet connection.

Target users are civil engineers and inspectors doing field assessments.

## Features

- Capture a crack photo with the camera or import one from the gallery.
- Classify cracks into four model classes: `flexural`, `settlement`, `shear`, and `corrosion`.
- Show confidence, urgency, technical guidance, visual indicators, recommended actions, and ACI references.
- Correct a wrong classification while preserving the original model prediction.
- Store classification history in SQLite.
- Export saved images as a ZIP grouped into `flexural/`, `shear/`, `settlement/`, and `corrosion/` folders.

## Tech Stack

- Expo SDK 54
- React Native 0.81
- TypeScript
- `react-native-fast-tflite`
- `expo-camera`, `expo-image-picker`, `expo-image-manipulator`
- `expo-sqlite`
- `jszip` and `expo-sharing`
- Jest with `ts-jest`

## Project Structure

```text
App.tsx                     Root screen flow
src/
  components/               Reusable UI components
  constants/                Model class names and preprocessing constants
  screens/                  Home, camera, result, and history screens
  services/                 Classifier, SQLite storage, ZIP export
  types/                    Shared TypeScript types
  utils/                    Pure helper logic and unit tests
assets/
  data/crack_templates.json Technical result templates
  models/                   TFLite/CoreML model files
android/                    Generated native Android project
```

## Requirements

Use an Expo dev client. Expo Go will not work because the app uses native modules, including `react-native-fast-tflite`, `expo-sqlite`, and camera integrations.

Install dependencies:

```bash
npm install
```

## Development

Start Metro for a dev-client build:

```bash
npm run start
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

Run the web target for UI-only checks:

```bash
npm run web
```

## Validation

Run TypeScript:

```bash
npm run typecheck
```

Run unit tests:

```bash
npm run test
```

CI test command:

```bash
npm run test:ci
```

## Model Notes

The classifier expects:

- Input size: `224x224`
- RGB image data
- ImageNet normalization
- NCHW tensor layout: `[1, 3, 224, 224]`
- Output order: `flexural`, `settlement`, `shear`, `corrosion`

The app maps model class names to template entries in `assets/data/crack_templates.json` through `CLASS_TO_TEMPLATE_KEY`.

## Android Releases

GitHub Actions workflow:

```text
.github/workflows/android-release.yml
```

It builds APKs for:

- `universal` using all supported architectures
- `armeabi-v7a`
- `arm64-v8a`
- `x86`
- `x86_64`

Push a tag like this to create a release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow runs typecheck, unit tests, generates the Android native project, builds release APKs per architecture plus a universal APK, uploads artifacts, and attaches APKs to the GitHub Release.

## Android Release Signing

Generate a private release keystore locally:

```bash
keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore crack-detector-release.keystore \
  -alias crack-detector \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Keep this file private. Do not commit it.

Encode it for GitHub Actions:

```bash
base64 -i crack-detector-release.keystore | pbcopy
```

On Linux, use:

```bash
base64 -w 0 crack-detector-release.keystore
```

Add these repository secrets in GitHub under `Settings > Secrets and variables > Actions`:

- `ANDROID_KEYSTORE_BASE64`: base64 output of the keystore file
- `ANDROID_KEYSTORE_PASSWORD`: keystore password
- `ANDROID_KEY_ALIAS`: key alias, for example `crack-detector`
- `ANDROID_KEY_PASSWORD`: key password

The release workflow decodes the keystore at build time and signs each architecture-specific APK with these secrets.
