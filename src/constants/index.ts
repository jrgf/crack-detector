import { CrackClass } from '../types';

export const CLASS_NAMES: CrackClass[] = ['flexural', 'settlement', 'shear', 'corrosion'];

export const IMAGE_SIZE = 224;

export const IMAGENET_MEAN = [0.485, 0.456, 0.406];
export const IMAGENET_STD = [0.229, 0.224, 0.225];

// Map model class names → template JSON keys (Spanish)
export const CLASS_TO_TEMPLATE_KEY: Record<CrackClass, string> = {
  flexural:   'flexion',
  settlement: 'asentamiento',
  shear:      'cortante',
  corrosion:  'corrosion',
};
