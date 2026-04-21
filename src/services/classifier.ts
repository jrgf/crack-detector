import { loadTensorflowModel, TfliteModel } from 'react-native-fast-tflite';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import {
  CLASS_NAMES,
  IMAGE_SIZE,
  IMAGENET_MEAN,
  IMAGENET_STD,
} from '../constants';
import { ClassificationResult, CrackClass } from '../types';

let model: TfliteModel | null = null;

export async function loadModel(): Promise<void> {
  if (model) return;

  model = await loadTensorflowModel(
    require('../../assets/models/crack_classifier_int8.tflite'),
    []
  );
  console.log('Model loaded:', model.inputs, model.outputs);
}

async function preprocessImage(uri: string): Promise<Float32Array> {
  const resized = await manipulateAsync(
    uri,
    [{ resize: { width: IMAGE_SIZE, height: IMAGE_SIZE } }],
    { compress: 1, format: SaveFormat.JPEG }
  );

  const decoded = await decodeJpegToPixels(resized.uri);
  const pixels = new Float32Array(IMAGE_SIZE * IMAGE_SIZE * 3);

  for (let i = 0; i < IMAGE_SIZE * IMAGE_SIZE; i++) {
    const r = decoded[i * 4] / 255;
    const g = decoded[i * 4 + 1] / 255;
    const b = decoded[i * 4 + 2] / 255;

    const channelSize = IMAGE_SIZE * IMAGE_SIZE;
    pixels[i] = (r - IMAGENET_MEAN[0]) / IMAGENET_STD[0];
    pixels[channelSize + i] = (g - IMAGENET_MEAN[1]) / IMAGENET_STD[1];
    pixels[channelSize * 2 + i] = (b - IMAGENET_MEAN[2]) / IMAGENET_STD[2];
  }

  return pixels;
}

async function decodeJpegToPixels(uri: string): Promise<Uint8Array> {
  const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
  const bytes = base64ToUint8Array(base64);
  const jpegJs = require('jpeg-js');
  const rawImageData = jpegJs.decode(bytes, { useTArray: true });

  if (rawImageData.width !== IMAGE_SIZE || rawImageData.height !== IMAGE_SIZE) {
    throw new Error(
      `Unexpected decoded image size: ${rawImageData.width}x${rawImageData.height}`
    );
  }

  return rawImageData.data;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const bytes = new Uint8Array((clean.length * 3) / 4 - padding);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  let byteIndex = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const chunk =
      (chars.indexOf(clean[i]) << 18) |
      (chars.indexOf(clean[i + 1]) << 12) |
      ((chars.indexOf(clean[i + 2]) & 63) << 6) |
      (chars.indexOf(clean[i + 3]) & 63);

    if (byteIndex < bytes.length) bytes[byteIndex++] = (chunk >> 16) & 255;
    if (byteIndex < bytes.length) bytes[byteIndex++] = (chunk >> 8) & 255;
    if (byteIndex < bytes.length) bytes[byteIndex++] = chunk & 255;
  }

  return bytes;
}

function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exp = logits.map(l => Math.exp(l - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map(e => e / sum);
}

export async function classifyImage(imageUri: string): Promise<ClassificationResult> {
  if (!model) throw new Error('Model not loaded. Call loadModel() first.');

  const input = await preprocessImage(imageUri);
  const inputBuffer = new Uint8Array(
    input.buffer,
    input.byteOffset,
    input.byteLength
  ).slice().buffer;
  const output = model.runSync([inputBuffer]);
  const logits = Array.from(new Float32Array(output[0]));

  if (logits.length !== CLASS_NAMES.length) {
    throw new Error(`Expected ${CLASS_NAMES.length} logits, got ${logits.length}.`);
  }

  const probs = softmax(logits);

  const maxIdx = probs.indexOf(Math.max(...probs));
  const predictedClass = CLASS_NAMES[maxIdx];
  const allProbs = CLASS_NAMES.reduce((acc, className, index) => {
    acc[className] = probs[index];
    return acc;
  }, {} as Record<CrackClass, number>);

  return {
    class: predictedClass,
    confidence: probs[maxIdx],
    allProbabilities: allProbs,
    imageUri,
    structureType: 'other',
    timestamp: Date.now(),
  };
}
