# Crack Detector — React Native App Context

## Project Overview

Mobile app for structural crack classification using an on-device ML model. The app runs inference locally — no server, no internet required. Target users are civil engineers performing field inspections.

---

## Model Details

**Architecture:** EfficientNet-B0 (trained with PyTorch/timm)
**Export format:** TFLite INT8 quantized (Android) + CoreML mlpackage FP16 (iOS)
**Input:** 224×224 RGB image, NCHW format
**Output:** 4 logits → softmax → class probabilities
**Preprocessing:** ImageNet normalization
```
mean = [0.485, 0.456, 0.406]
std  = [0.229, 0.224, 0.225]
```

**Classes (in order — index matters):**
```
0: flexural    — vertical cracks at midspan from bending stress
1: settlement  — diagonal stair-step cracks from foundation settlement
2: shear       — diagonal ~45° cracks near supports
3: corrosion   — longitudinal cracks with rust staining from rebar corrosion
```

**Performance:**
```
              precision  recall  f1-score  support
  flexural       1.00    0.99      0.99     142
  settlement     0.71    0.95      0.81      37
  shear          0.93    0.68      0.78      37
  corrosion      1.00    1.00      1.00      18
  accuracy                         0.93     234
```

**Model files location:**
- `assets/models/crack_classifier_int8.tflite` (16 MB)
- `assets/models/crack_classifier.mlpackage` (iOS)

---

## Tech Stack

- **React Native with Expo** (dev client, NOT managed — native modules required)
- **TypeScript**
- **react-native-fast-tflite** — for on-device TFLite/CoreML inference
- **expo-camera** — camera capture
- **expo-image-picker** — gallery selection
- **expo-image-manipulator** — resize to 224×224
- **react-native-reanimated** + **react-native-worklets-core** — required by react-native-fast-tflite

---

## Already Configured

### metro.config.js
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('tflite');
module.exports = config;
```

### app.json
```json
{
  "expo": {
    "name": "Crack Detector",
    "slug": "crack-detector",
    "version": "1.0.0",
    "orientation": "portrait",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.rafa.crackdetector",
      "infoPlist": {
        "NSCameraUsageDescription": "Need camera access to photograph structural cracks",
        "NSPhotoLibraryUsageDescription": "Need photo library access to analyze existing photos"
      }
    },
    "android": {
      "package": "com.rafa.crackdetector",
      "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE"]
    },
    "plugins": [
      "expo-camera",
      "expo-image-picker",
      ["react-native-fast-tflite", { "enableCoreMLDelegate": true }]
    ]
  }
}
```

### Installed packages
```
expo-dev-client
expo-camera
expo-image-picker
expo-image-manipulator
expo-file-system
react-native-fast-tflite
react-native-reanimated
react-native-worklets-core
expo-sqlite
jpeg-js
```

---

## MVP Features

### Feature 1: Image Capture
- Take photo with camera (primary action)
- Select from gallery (secondary action)
- Show capture guide overlay: "Include at least 1 meter around the crack"

### Feature 2: Classification
- Preprocess image: resize to 224×224, normalize with ImageNet mean/std
- Run TFLite inference on-device
- Return: predicted class, confidence, all probabilities

### Feature 3: Result Display
- Show the captured image
- Show predicted class with confidence percentage
- Show urgency indicator (color-coded: green/yellow/orange/red)
- Show technical template from crack_templates.json:
  - Short description
  - Common causes
  - Visual indicators
  - Severity thresholds
  - Recommended actions
- ACI reference
- If confidence < 70%: show top-2 classes, suggest retaking photo

### Feature 4: Correction and History
- User can correct a wrong classification on the result screen
- Results are stored in SQLite and can be reviewed from History
- History can export a ZIP grouped into flexural, shear, settlement, and corrosion folders

---

## Technical Templates

The file `assets/data/crack_templates.json` contains detailed technical information for each crack class. Structure:

```json
{
  "classes": {
    "flexural": {
      "label": "Flexural Crack",
      "short_description": "...",
      "common_causes": ["...", "..."],
      "visual_indicators": ["...", "..."],
      "severity_thresholds": { "minor": "...", "moderate": "...", "severe": "..." },
      "recommended_actions": ["...", "..."],
      "urgency_level": "medium",
      "aci_reference": "ACI 224R-01 Chapter 4",
      "common_elements": ["Beams", "One-way slabs", "Cantilevers"]
    },
    "settlement": { ... },
    "shear": { ... },
    "corrosion": { ... }
  },
  "urgency_levels": {
    "low":      { "color": "#4ade80", "label": "Low", "action": "..." },
    "medium":   { "color": "#facc15", "label": "Medium", "action": "..." },
    "high":     { "color": "#fb923c", "label": "High", "action": "..." },
    "critical": { "color": "#ef4444", "label": "Critical", "action": "..." }
  },
  "disclaimer": "This tool provides preliminary classification..."
}
```

---

## Preprocessing Pipeline (critical — must match training exactly)

```
1. Load image (any size)
2. Resize to 224×224 (bilinear interpolation)
3. Convert to float32, divide by 255.0
4. Normalize: pixel = (pixel - mean) / std
   mean = [0.485, 0.456, 0.406]  (RGB channels)
   std  = [0.229, 0.224, 0.225]  (RGB channels)
5. Arrange as NCHW tensor: shape [1, 3, 224, 224]
6. Feed to model
7. Output: 4 logits
8. Apply softmax: exp(logit) / sum(exp(logits))
9. Argmax → predicted class
```

---

## Recommended App Structure

```
src/
├── types/
│   └── index.ts              # CrackClass, StructureType, etc.
├── constants/
│   └── index.ts              # CLASS_NAMES, IMAGE_SIZE
├── services/
│   └── classifier.ts         # loadModel(), classifyImage()
├── screens/
│   ├── HomeScreen.tsx         # Camera/gallery/history buttons
│   ├── CameraScreen.tsx       # Camera with guide overlay
│   └── ResultScreen.tsx       # Classification result + template
├── components/
│   ├── UrgencyBadge.tsx       # Color-coded urgency indicator
│   └── TemplateCard.tsx       # Expandable sections for template info
└── hooks/
    └── useClassifier.ts       # Hook wrapping model load + inference
```

---

## Navigation Flow

```
HomeScreen
    ↓ tap "Take Photo"
CameraScreen (capture with guide overlay)
    ↓ photo taken
ResultScreen (show classification + template)
    ↓ tap "New Analysis"
HomeScreen
```

Alternative flow:
```
HomeScreen → tap "Select from Gallery" → image selected → ResultScreen
```

---

## UX Requirements

- Model should load on app startup (show loading screen)
- Inference should complete in <500ms
- Show loading indicator during classification
- Result screen should show image + result without scrolling on first view
- Technical template details should be scrollable below the fold
- Disclaimer always visible at the bottom of results
- Dark theme preferred (field use in various lighting conditions)

---

## Things to Watch Out For

1. **react-native-fast-tflite** requires Expo dev client build, NOT Expo Go
2. **NCHW format** — the model expects channels-first, not channels-last (NHWC)
3. **ImageNet normalization** — if you skip this or use wrong values, predictions will be garbage
4. **jpeg-js** may be needed to decode image bytes to raw RGB pixels for preprocessing
5. **CoreML delegate** is enabled in app.json for iOS — uses Neural Engine on Apple silicon
6. **.tflite file** must be registered in metro.config.js as an asset extension
