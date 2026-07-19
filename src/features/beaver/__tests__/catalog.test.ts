import type { AvatarConfig } from '@/lib/database.types';

import {
  beaverBodyColor,
  beaverBodySlotChain,
  beaverBodySlotName,
  beaverSex,
  DEFAULT_BEAVER,
} from '../catalog';

describe('beaver base catalog', () => {
  it('builds the registry slot name from sex × color × state (default content)', () => {
    expect(beaverBodySlotName({ sex: 'male', bodyColor: 'brown' })).toBe(
      'beaverBodyMaleBrownContent',
    );
    expect(beaverBodySlotName({ sex: 'female', bodyColor: 'black' })).toBe(
      'beaverBodyFemaleBlackContent',
    );
    expect(
      beaverBodySlotName({ sex: 'female', bodyColor: 'white' }, 'thriving'),
    ).toBe('beaverBodyFemaleWhiteThriving');
    expect(
      beaverBodySlotName({ sex: 'female', bodyColor: 'brown' }, 'unhappy'),
    ).toBe('beaverBodyFemaleBrownUnhappy');
  });

  it('okay + neglected are gender-agnostic: color-only slot, same for both sexes', () => {
    expect(
      beaverBodySlotName({ sex: 'male', bodyColor: 'brown' }, 'okay'),
    ).toBe('beaverBodyBrownOkay');
    expect(
      beaverBodySlotName({ sex: 'female', bodyColor: 'brown' }, 'okay'),
    ).toBe('beaverBodyBrownOkay');
    expect(
      beaverBodySlotName({ sex: 'male', bodyColor: 'white' }, 'neglected'),
    ).toBe('beaverBodyWhiteNeglected');
    expect(
      beaverBodySlotName({ sex: 'female', bodyColor: 'white' }, 'neglected'),
    ).toBe('beaverBodyWhiteNeglected');
  });

  it('slot chain falls back state → content → thriving without duplicates', () => {
    expect(
      beaverBodySlotChain({ sex: 'female', bodyColor: 'black' }, 'neglected'),
    ).toEqual([
      'beaverBodyBlackNeglected',
      'beaverBodyFemaleBlackContent',
      'beaverBodyFemaleBlackThriving',
    ]);
    // Asking for content itself doesn't repeat it.
    expect(
      beaverBodySlotChain({ sex: 'male', bodyColor: 'brown' }, 'content'),
    ).toEqual(['beaverBodyMaleBrownContent', 'beaverBodyMaleBrownThriving']);
  });

  it('falls back to the default body (male/brown/content) for empty or partial config', () => {
    expect(beaverSex(undefined)).toBe(DEFAULT_BEAVER.sex);
    expect(beaverBodyColor(undefined)).toBe(DEFAULT_BEAVER.bodyColor);
    expect(beaverBodySlotName({})).toBe('beaverBodyMaleBrownContent');
    // A legacy hiker config (no beaver fields) resolves to the default body.
    const legacy: AvatarConfig = { skinTone: 'skin2', hair: 'hair2' };
    expect(beaverBodySlotName(legacy)).toBe('beaverBodyMaleBrownContent');
  });

  it('covers all six distinct bodies with unique slot names (per state)', () => {
    const sexes = ['male', 'female'] as const;
    const colors = ['brown', 'white', 'black'] as const;
    const slots = sexes.flatMap((sex) =>
      colors.map((bodyColor) => beaverBodySlotName({ sex, bodyColor })),
    );
    expect(new Set(slots).size).toBe(6);
  });
});
