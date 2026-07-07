import { resolveLayers, SLOT_ORDER, type CatalogEntry } from '../layers';

const CATALOG: CatalogEntry[] = [
  { id: 'boots-1', slot: 'boots', name: 'Trail Runners', rarity: 'common' },
  { id: 'pants-1', slot: 'pants', name: 'River Rolls', rarity: 'rare' },
  { id: 'pack-1', slot: 'backpack', name: 'Daypack', rarity: 'common' },
  { id: 'hat-1', slot: 'hats', name: 'Bucket Hat', rarity: 'common' },
  { id: 'shades-1', slot: 'sunglasses', name: 'Camp Shades', rarity: 'common' },
  { id: 'shirt-1', slot: 'shirts', name: 'Flannel Scout', rarity: 'rare' },
  { id: 'jacket-1', slot: 'jacket', name: 'Pine Parka', rarity: 'rare' },
  { id: 'pet-1', slot: 'pet', name: 'Pocket Frog', rarity: 'common' },
];

const slots = (layers: ReturnType<typeof resolveLayers>) => layers.map((l) => l.slot);

describe('resolveLayers', () => {
  it('renders only the auto-equipped base gear when nothing is equipped', () => {
    const layers = resolveLayers(undefined, CATALOG);
    expect(slots(layers)).toEqual(['backpack', 'pants', 'shirts']);
    expect(layers.every((l) => l.cosmetic === null)).toBe(true);
  });

  it('swaps base gear for equipped cosmetics in place', () => {
    const layers = resolveLayers({ shirts: 'shirt-1', pants: 'pants-1' }, CATALOG);
    expect(layers.find((l) => l.slot === 'shirts')?.cosmetic?.id).toBe('shirt-1');
    expect(layers.find((l) => l.slot === 'pants')?.cosmetic?.id).toBe('pants-1');
    expect(layers.find((l) => l.slot === 'backpack')?.cosmetic).toBeNull();
  });

  it('adds no-base slots only when equipped', () => {
    expect(slots(resolveLayers({}, CATALOG))).not.toContain('boots');
    const layers = resolveLayers(
      { boots: 'boots-1', hats: 'hat-1', sunglasses: 'shades-1', pet: 'pet-1' },
      CATALOG,
    );
    expect(slots(layers)).toEqual(
      expect.arrayContaining(['boots', 'hats', 'sunglasses', 'pet']),
    );
  });

  it('jacket-closed rule (LOCKED): an equipped jacket removes the shirt layer', () => {
    // Base shirt gone:
    expect(slots(resolveLayers({ jacket: 'jacket-1' }, CATALOG))).not.toContain('shirts');
    // Cosmetic shirt gone too:
    const layers = resolveLayers({ jacket: 'jacket-1', shirts: 'shirt-1' }, CATALOG);
    expect(slots(layers)).not.toContain('shirts');
    expect(slots(layers)).toContain('jacket');
  });

  it('treats stale/unknown cosmetic ids as unequipped (base fallback)', () => {
    const layers = resolveLayers({ shirts: 'deleted-id', hats: 'deleted-id' }, CATALOG);
    expect(layers.find((l) => l.slot === 'shirts')?.cosmetic).toBeNull();
    expect(slots(layers)).not.toContain('hats');
  });

  it('ignores an id equipped under the wrong slot (corrupt config)', () => {
    const layers = resolveLayers({ hats: 'boots-1' }, CATALOG);
    expect(slots(layers)).not.toContain('hats');
    expect(slots(layers)).not.toContain('boots');
  });

  it('always emits layers in the LOCKED back-to-front slot order', () => {
    const layers = resolveLayers(
      {
        boots: 'boots-1',
        pants: 'pants-1',
        backpack: 'pack-1',
        hats: 'hat-1',
        sunglasses: 'shades-1',
        shirts: 'shirt-1',
        pet: 'pet-1',
      },
      CATALOG,
    );
    const order = slots(layers);
    const expected = SLOT_ORDER.filter((s) => order.includes(s));
    expect(order).toEqual(expected);
  });
});
