/**
 * Beaver cosmetic layer resolution (spec §10.2; Rig Bible §3, LOCKED z-order).
 * Four independent gacha slots stacked over the body — every cosmetic is
 * standalone, no combinatorial art, no jacket-style occlusion rules and no
 * base fallbacks (the beaver starts plain, §18; an empty slot draws nothing).
 *
 * Pure + unit-tested: stale/wrong-slot ids resolving safely is
 * invisible-when-wrong (§2.1). The renderer (BeaverPreview) draws these
 * back-to-front, interleaving the body (at its Happiness state) between the
 * tail and the remaining slots.
 */

export type BeaverSlot = 'tails' | 'gloves' | 'eyes' | 'hats';

export type BeaverRarity = 'common' | 'rare' | 'epic' | 'legendary';

/** The slice of a cosmetics-catalog row the renderer needs. */
export interface BeaverCatalogEntry {
  id: string;
  slot: BeaverSlot;
  name: string;
  rarity: BeaverRarity;
  /** Registry slot holding the item's layer art (DB `asset_slot_name`). */
  asset_slot_name?: string;
}

/**
 * Back-to-front draw order (Rig Bible §3): tail sits BEHIND the body (z0), so
 * it leads; gloves (z2), eyes accessory (z3), hats (z4) sit over the body. The
 * renderer places the body (z1) after the tail and before the rest.
 */
export const BEAVER_SLOT_ORDER: readonly BeaverSlot[] = [
  'tails',
  'gloves',
  'eyes',
  'hats',
];

/** Slots that draw BEHIND the body (Rig Bible §3: tail is z0). */
export const BEHIND_BODY: ReadonlySet<BeaverSlot> = new Set(['tails']);

export interface ResolvedBeaverLayer {
  slot: BeaverSlot;
  cosmetic: BeaverCatalogEntry;
}

/**
 * Resolve `avatar_config.equipped` (slot → cosmetic id) against the catalog
 * into ordered draw layers. Unknown/stale ids, and ids equipped under the
 * wrong slot, are dropped — a catalog change can never crash the render.
 * Empty slots simply produce no layer (start plain, §18).
 */
export function resolveBeaverLayers(
  equipped: Record<string, string> | undefined,
  catalog: readonly BeaverCatalogEntry[],
): ResolvedBeaverLayer[] {
  const byId = new Map(catalog.map((c) => [c.id, c]));
  const layers: ResolvedBeaverLayer[] = [];
  for (const slot of BEAVER_SLOT_ORDER) {
    const equippedId = equipped?.[slot];
    const entry = equippedId ? byId.get(equippedId) : undefined;
    if (entry && entry.slot === slot) {
      layers.push({ slot, cosmetic: entry });
    }
  }
  return layers;
}
