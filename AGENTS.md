# Repository Guidelines

## Project Structure & Module Organization

This is an Expo React Native app for on-device structural crack classification. Entry points are `index.ts` and `App.tsx`. Feature code lives under `src/`: `screens/` for app flows, `components/` for reusable UI, `services/` for inference/storage/export logic, `constants/` for model metadata, and `types/` for shared TypeScript types. Static assets live in `assets/`, including `assets/models/` for TFLite/CoreML files and `assets/data/crack_templates.json` for result copy. Native Android output is in `android/`; regenerate native folders with Expo tooling when config changes.

## Build, Test, and Development Commands

- `npm run start`: starts Expo Metro. Use a dev-client build, not Expo Go, because `react-native-fast-tflite` is native.
- `npm run android`: builds and runs the Android app with Expo.
- `npm run ios`: builds and runs the iOS app with Expo.
- `npm run web`: starts the web target for UI-only checks.
- `npm run typecheck`: runs strict TypeScript validation.
- `npm run test:ci`: runs unit tests once in CI mode.
- `npx expo install --check`: checks Expo package version compatibility.

## Coding Style & Naming Conventions

Use TypeScript with strict types. Keep React components in PascalCase files, for example `CameraScreen.tsx` and `UrgencyBadge.tsx`. Use camelCase for functions, variables, and props. Prefer small typed interfaces near the component or service that owns them. Match the existing two-space indentation and single-quote import style. Keep inference constants aligned with model output order: `flexural`, `settlement`, `shear`, `corrosion`.

## Testing Guidelines

Until a test runner is added, verify changes with `npx tsc --noEmit` and a dev-client smoke test on the target platform. For inference changes, test both camera capture and gallery import, and confirm the result screen shows confidence, urgency, and the mapped template. Future tests should use `*.test.ts` or `*.test.tsx` naming and live beside the module under test or in a dedicated `__tests__/` folder.

## Commit & Pull Request Guidelines

The history currently only contains an initial commit, so use simple imperative commit messages such as `Add camera capture flow` or `Fix preprocessing tensor shape`. Pull requests should include a brief summary, validation steps, screenshots or screen recordings for UI changes, and notes for any model, native config, or asset changes. Mention whether a new dev-client build is required.

## Architecture & Configuration Notes

The model expects 224x224 RGB input in NCHW format with ImageNet normalization. `metro.config.js` registers `.tflite` assets. `app.json` enables the new architecture and configures camera, gallery, and `react-native-fast-tflite` CoreML support.
