/**
 * Avatar layer resolution (spec §10 LOCKED): independent stacked layers, one
 * per cosmetic slot, every cosmetic standalone over the base — no
 * combinatorial art. Pure and unit-tested: the jacket-closed rule and base
 * fallbacks are invisible-when-wrong (spec §2.1).
 *
 * The renderer (AvatarPreview) draws these back-to-front, interleaving the
 * base anatomy (head, eyes, hair) at its fixed position.
 */
import type { AvatarConfig } from '@/lib/database.types';

export type CosmeticSlot =
  | 'boots'
  | 'pants'
  | 'backpack'
  | 'hats'
  | 'sunglasses'
  | 'shirts'
  | 'jacket'
  | 'pet';

export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary';

/** The slice of a cosmetics-catalog row the renderer needs. */
export interface CatalogEntry {
  id: string;
  slot: CosmeticSlot;
  name: string;
  rarity: CosmeticRarity;
}

/** Back-to-front draw order (LOCKED layering, spec §10). */
export const SLOT_ORDER: readonly CosmeticSlot[] = [
  'backpack', // peeks out behind the body
  'pants',
  'boots',
  'shirts',
  'jacket', // over (and fully occluding) the shirt
  'hats', // over hair
  'sunglasses', // over eyes
  'pet', // companion, front
];

/** Slots with auto-equipped base gear when no cosmetic is worn (spec §10). */
const BASE_SLOTS: ReadonlySet<CosmeticSlot> = new Set(['shirts', 'pants', 'backpack']);

export interface ResolvedLayer {
  slot: CosmeticSlot;
  /** null = the auto-equipped base gear (shirts/pants/backpack only). */
  cosmetic: CatalogEntry | null;
}

/**
 * Resolve the equipped map (`avatar_config.equipped`: slot → cosmetic id)
 * against the catalog into ordered draw layers.
 *
 * - Unknown/stale cosmetic ids and ids equipped under the wrong slot are
 *   treated as unequipped (base fallback where one exists) — a catalog
 *   change can never crash the render.
 * - Jacket-closed rule (LOCKED): an equipped jacket removes the shirt layer
 *   entirely, base or cosmetic.
 */
export function resolveLayers(
  equipped: AvatarConfig['equipped'],
  catalog: readonly CatalogEntry[],
): ResolvedLayer[] {
  const byId = new Map(catalog.map((c) => [c.id, c]));

  const layers: ResolvedLayer[] = [];
  for (const slot of SLOT_ORDER) {
    const equippedId = equipped?.[slot];
    const entry = equippedId ? byId.get(equippedId) : undefined;
    if (entry && entry.slot === slot) {
      layers.push({ slot, cosmetic: entry });
    } else if (BASE_SLOTS.has(slot)) {
      layers.push({ slot, cosmetic: null });
    }
  }

  const jacketWorn = layers.some((l) => l.slot === 'jacket');
  return jacketWorn ? layers.filter((l) => l.slot !== 'shirts') : layers;
}
