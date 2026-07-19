import placementData from '@/assets/art/beaver-placement.json';
import { assetRegistry } from '@/assets/registry';

import {
  BODY_Z,
  getPlacement,
  PLACEMENT_CANVAS,
  PLACEMENT_KEYS,
  toolDefaultZ,
} from '../placement';

describe('beaver placement data', () => {
  it('authored against the 1024² composite canvas', () => {
    expect(PLACEMENT_CANVAS).toBe(1024);
  });

  it('every mapped slot has BOTH a JSON placement entry and registered art', () => {
    // Catches a renamed art file or placement key drifting from the mapping:
    // the founder saves by filename-derived key, the app looks up by slot.
    const missingJson = Object.entries(PLACEMENT_KEYS)
      .filter(([, key]) => !(key in placementData.items))
      .map(([slot, key]) => `${slot} → ${key}`);
    const missingArt = Object.keys(PLACEMENT_KEYS).filter(
      (slot) => !(slot in assetRegistry),
    );
    expect(missingJson).toEqual([]);
    expect(missingArt).toEqual([]);
  });

  it('maps all 24 body slots and all 19 cosmetic slots', () => {
    const slots = Object.keys(PLACEMENT_KEYS);
    expect(slots.filter((s) => s.startsWith('beaverBody'))).toHaveLength(24);
    expect(slots.filter((s) => s.startsWith('cos'))).toHaveLength(19);
  });

  it('resolves a placed cosmetic with defaults filled in', () => {
    const crown = getPlacement('cosHatsCrown');
    expect(crown).toMatchObject({ x: 2, y: -230, w: 1475, h: 1045, scale: 0.4 });
    expect(crown?.rotation).toBe(0); // omitted in JSON → 0
    expect(crown?.z).toBe(4); // omitted → tool default ("crown" keyword → hats)
  });

  it('explicit z from the JSON wins over the tool default', () => {
    expect(getPlacement('cosTailsCheckerboard')?.z).toBe(0.5); // authored
    expect(getPlacement('cosEyesSunglasses')?.z).toBe(4.5); // authored above hats
  });

  it('replicates the tool z defaults exactly for unset-z items', () => {
    // "bow" matches no keyword → tool stacked it topmost (5); the founder
    // approved that stacking, so the app must reproduce it.
    expect(toolDefaultZ('bow')).toBe(5);
    expect(getPlacement('cosHatsBowHat')?.z).toBe(5);
    expect(getPlacement('cosGlovesBlue')?.z).toBe(2); // "glove" keyword
    expect(getPlacement('cosHatsPropeller')?.z).toBe(4); // "hat" keyword
    expect(getPlacement('cosTailsGold')?.z).toBe(0); // "tail" keyword
  });

  it('bodies resolve centered at z1 regardless of key wording', () => {
    for (const slot of Object.keys(PLACEMENT_KEYS).filter((s) =>
      s.startsWith('beaverBody'),
    )) {
      const p = getPlacement(slot);
      expect(p).not.toBeNull();
      expect(p?.x).toBe(0);
      expect(p?.y).toBe(0);
      expect(p?.z).toBe(BODY_Z);
    }
  });

  it('gender-agnostic states share one entry; oversized exports carry a scale', () => {
    // okay/neglected have a single color-keyed slot (no per-sex variant).
    expect(getPlacement('beaverBodyBrownOkay')).not.toBeNull();
    expect(getPlacement('beaverBodyBlackNeglected')).not.toBeNull();
    // The two big Unhappy exports are normalized to the ~470px body family.
    expect(getPlacement('beaverBodyFemaleBlackUnhappy')?.scale).toBeLessThan(1);
    expect(getPlacement('beaverBodyFemaleWhiteUnhappy')?.scale).toBeLessThan(1);
  });

  it('unknown or unplaced slots resolve to null, never throw', () => {
    expect(getPlacement('cosHatsNotAThing')).toBeNull();
    expect(getPlacement('')).toBeNull();
    expect(getPlacement('hikerBase')).toBeNull();
  });
});
