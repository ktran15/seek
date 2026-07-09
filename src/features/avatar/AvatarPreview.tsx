import { Image, View } from 'react-native';

import { getAssetOrNull } from '@/assets/registry';
import type { AvatarConfig } from '@/lib/database.types';

import { baseLayerSlotNames } from './catalog';
import { canvasRect, frameFor } from './frame';
import { resolveLayers, type CatalogEntry, type ResolvedLayer } from './layers';

/**
 * Layered avatar compositor (Rig Bible §3): every layer is a full 1024²
 * image registered on the master canvas, so compositing is a plain stack of
 * <Image>s at one shared rect — no per-layer positioning code. What's worn
 * comes from resolveLayers (LOCKED z-order + jacket-closed rule,
 * unit-tested). Base shirt/pants fallbacks are baked into the frozen body
 * master, so a null-cosmetic layer renders nothing. Cosmetic art still
 * pending shows as its translucent anchor-zone box (placeholder registry
 * files); base eyes/hair variant layers skip entirely until the batch art
 * lands (the master's baked features show instead).
 */
export function AvatarPreview({
  config,
  cosmetics = [],
  height = 200,
}: {
  config: AvatarConfig;
  cosmetics?: readonly CatalogEntry[];
  height?: number;
}) {
  const worn = resolveLayers(config.equipped, cosmetics).filter((l) => l.cosmetic !== null);
  const frame = frameFor(worn.map((l) => l.slot));
  const width = Math.round(
    (height * (frame.x[1] - frame.x[0])) / (frame.y[1] - frame.y[0]),
  );
  const rect = canvasRect(frame, width, height);
  const base = baseLayerSlotNames(config);

  const layerStyle = {
    position: 'absolute' as const,
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
  const layer = (slotName: string, key: string) => {
    const source = getAssetOrNull(slotName);
    return source ? (
      <Image key={key} source={source} style={layerStyle} resizeMode="contain" />
    ) : null;
  };
  const cosmeticLayer = (l: ResolvedLayer) =>
    l.cosmetic?.asset_slot_name ? layer(l.cosmetic.asset_slot_name, l.slot) : null;

  return (
    <View
      style={{ width, height, alignSelf: 'center', overflow: 'hidden' }}
      accessibilityLabel="Avatar preview"
    >
      {/* backpack sits behind the body (z0) */}
      {worn.filter((l) => l.slot === 'backpack').map(cosmeticLayer)}
      {layer(base.body, 'body')}
      {layer(base.eyes, 'eyes')}
      {layer(base.hair, 'hair')}
      {worn.filter((l) => l.slot !== 'backpack').map(cosmeticLayer)}
    </View>
  );
}
