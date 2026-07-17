import {
  BEAVER_SLOT_ORDER,
  BEHIND_BODY,
  resolveBeaverLayers,
  type BeaverCatalogEntry,
} from '../layers';

const CATALOG: BeaverCatalogEntry[] = [
  { id: 'h1', slot: 'hats', name: 'Beanie', rarity: 'common' },
  { id: 't1', slot: 'tails', name: 'Red Beaver Tail', rarity: 'common' },
  { id: 'g1', slot: 'gloves', name: 'Red Boxing Gloves', rarity: 'common' },
  { id: 'e1', slot: 'eyes', name: 'Sunglasses', rarity: 'common' },
];

describe('resolveBeaverLayers', () => {
  it('draws equipped cosmetics in the LOCKED z-order (tail→gloves→eyes→hats)', () => {
    const layers = resolveBeaverLayers(
      { hats: 'h1', tails: 't1', eyes: 'e1', gloves: 'g1' },
      CATALOG,
    );
    expect(layers.map((l) => l.slot)).toEqual(['tails', 'gloves', 'eyes', 'hats']);
    expect(layers.map((l) => l.slot)).toEqual([...BEAVER_SLOT_ORDER]);
  });

  it('produces no layers for an empty/undefined equip (start plain, §18)', () => {
    expect(resolveBeaverLayers(undefined, CATALOG)).toEqual([]);
    expect(resolveBeaverLayers({}, CATALOG)).toEqual([]);
  });

  it('ignores unknown/stale cosmetic ids', () => {
    expect(resolveBeaverLayers({ hats: 'gone' }, CATALOG)).toEqual([]);
  });

  it('ignores an id equipped under the wrong slot', () => {
    // t1 is a tails item; equipping it in the hats slot resolves to nothing.
    expect(resolveBeaverLayers({ hats: 't1' }, CATALOG)).toEqual([]);
  });

  it('keeps only the tail behind the body', () => {
    expect(BEHIND_BODY.has('tails')).toBe(true);
    expect(BEHIND_BODY.has('hats')).toBe(false);
    expect(BEHIND_BODY.has('gloves')).toBe(false);
    expect(BEHIND_BODY.has('eyes')).toBe(false);
  });
});
