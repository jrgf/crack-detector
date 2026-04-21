import { CLASS_NAMES } from '../constants';
import { getCorrectionOptions, getDisplayClass } from './classification';

describe('classification helpers', () => {
  it('uses the model class when there is no correction', () => {
    expect(getDisplayClass({ class: 'shear' })).toBe('shear');
  });

  it('uses the corrected class when one exists', () => {
    expect(getDisplayClass({ class: 'shear', correctedClass: 'corrosion' })).toBe('corrosion');
  });

  it('offers corrosion as a correction when it is not the current class', () => {
    expect(getCorrectionOptions('shear')).toContain('corrosion');
  });

  it('does not offer the current class as a correction', () => {
    expect(getCorrectionOptions('corrosion')).not.toContain('corrosion');
  });

  it('offers exactly every class except the current class', () => {
    const options = getCorrectionOptions('settlement');

    expect(options).toHaveLength(CLASS_NAMES.length - 1);
    expect(options).toEqual(expect.arrayContaining(['flexural', 'shear', 'corrosion']));
  });
});
