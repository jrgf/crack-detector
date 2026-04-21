# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Mobile app for on-device structural crack classification using EfficientNet-B0 (TFLite/CoreML). Target users: civil engineers doing field inspections. No server — all inference runs locally.

## Commands

```bash
npx expo start             # Start dev server (requires dev client build, NOT Expo Go)
npx expo prebuild          # Generate native projects (ios/, android/)
npx expo run:ios           # Build and run on iOS simulator/device
npx expo run:android       # Build and run on Android emulator/device
npx tsc --noEmit           # Type check
```

No test runner configured yet.

## Architecture

```
App.tsx                     # Root component with home/camera/result screen flow
src/
  types/index.ts            # CrackClass, StructureType, ClassificationResult types
  constants/index.ts        # CLASS_NAMES, IMAGE_SIZE, IMAGENET normalization
  services/classifier.ts    # loadModel(), classifyImage() — core inference pipeline
  screens/CameraScreen.tsx  # Camera preview with guide overlay and capture action
assets/
  models/                   # TFLite + CoreML model files (~16MB)
  data/crack_templates.json # Technical info per crack class (ACI references, severity, actions)
metro.config.js             # Registers .tflite as asset extension
```

### Inference Pipeline (classifier.ts)

1. Resize image to 224x224
2. Decode JPEG to raw pixels (jpeg-js)
3. Normalize with ImageNet mean/std
4. Arrange as NCHW Float32Array [1, 3, 224, 224]
5. Run model → 4 logits
6. Softmax → probabilities
7. Argmax → predicted class

## Current Data Alignment

- Model output is 4 logits in this order: flexural, settlement, shear, corrosion
- `src/types/index.ts` and `src/constants/index.ts` include all 4 model classes
- Class probabilities come directly from model softmax output; there is no structure-type selector in the UI
- `assets/data/crack_templates.json` contains Spanish template keys plus extra non-model classes; use `CLASS_TO_TEMPLATE_KEY` to map the 4 model classes to their template entries

## Critical Constraints

- **Expo dev client required** — react-native-fast-tflite has native modules, cannot run in Expo Go
- **New Architecture enabled** (`newArchEnabled: true` in app.json)
- **NCHW format** — model expects channels-first, not channels-last
- **ImageNet normalization** — must match training exactly or predictions are garbage
- **react-native-reanimated + worklets-core** — required peer deps of react-native-fast-tflite
- Model files are large (~16MB) — already gitignored patterns should account for this

## Stack

- Expo SDK 54 / React Native 0.81 / TypeScript strict
- react-native-fast-tflite (CoreML delegate enabled for iOS)
- expo-camera, expo-image-picker, expo-image-manipulator
- expo-sqlite
- jpeg-js (JPEG decoding to raw pixels)
