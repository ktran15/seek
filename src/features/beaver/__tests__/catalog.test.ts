import type { AvatarConfig } from '@/lib/database.types';

import {
  beaverBodyColor,
  beaverBodySlotName,
  beaverSex,
  DEFAULT_BEAVER,
} from '../catalog';

describe('beaver base catalog', () => {
  it('builds the registry slot name from sex × color', () => {
    expect(beaverBodySlotName({ sex: 'male', bodyColor: 'brown' })).toBe(
      'beaverBodyMaleBrown',
    );
    expect(beaverBodySlotName({ sex: 'female', bodyColor: 'black' })).toBe(
      'beaverBodyFemaleBlack',
    );
    expect(beaverBodySlotName({ sex: 'female', bodyColor: 'white' })).toBe(
      'beaverBodyFemaleWhite',
    );
  });

  it('falls back to the default body (male/brown) for empty or partial config', () => {
    expect(beaverSex(undefined)).toBe(DEFAULT_BEAVER.sex);
    expect(beaverBodyColor(undefined)).toBe(DEFAULT_BEAVER.bodyColor);
    expect(beaverBodySlotName({})).toBe('beaverBodyMaleBrown');
    // A legacy hiker config (no beaver fields) resolves to the default body.
    const legacy: AvatarConfig = { skinTone: 'skin2', hair: 'hair2' };
    expect(beaverBodySlotName(legacy)).toBe('beaverBodyMaleBrown');
  });

  it('covers all six distinct bodies with unique slot names', () => {
    const sexes = ['male', 'female'] as const;
    const colors = ['brown', 'white', 'black'] as const;
    const slots = sexes.flatMap((sex) =>
      colors.map((bodyColor) => beaverBodySlotName({ sex, bodyColor })),
    );
    expect(new Set(slots).size).toBe(6);
  });
});
