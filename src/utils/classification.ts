import { CLASS_NAMES } from '../constants';
import { ClassificationResult, CrackClass } from '../types';

export function getDisplayClass(
  result: Pick<ClassificationResult, 'class' | 'correctedClass'>
): CrackClass {
  return result.correctedClass ?? result.class;
}

export function getCorrectionOptions(currentClass: CrackClass): CrackClass[] {
  return CLASS_NAMES.filter(className => className !== currentClass);
}
