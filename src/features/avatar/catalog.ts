/**
 * Avatar base-customization catalog (spec §10): skin color, eyes, hairstyle,
 * hair color. Base shirt/pants/backpack auto-equip. Ids are stable and stored
 * in `profiles.avatar_config`; the M12 art pass maps each id to real layer art
 * (Rig Bible: recolors + variant layers on the frozen base).
 */
import type { AvatarConfig } from '@/lib/database.types';

export interface SwatchOption {
  id: string;
  /** Display color for the picker + placeholder render. */
  color: string;
  label: string;
}

export interface StyleOption {
  id: string;
  label: string;
}

export const SKIN_TONES: SwatchOption[] = [
  { id: 'skin1', color: '#F6D7BD', label: 'Light' },
  { id: 'skin2', color: '#E8B98F', label: 'Warm' },
  { id: 'skin3', color: '#C68E62', label: 'Tan' },
  { id: 'skin4', color: '#96613C', label: 'Brown' },
  { id: 'skin5', color: '#5E3A22', label: 'Deep' },
];

export const EYES: StyleOption[] = [
  { id: 'eyes1', label: 'Round' },
  { id: 'eyes2', label: 'Happy' },
  { id: 'eyes3', label: 'Focused' },
];

export const HAIR_STYLES: StyleOption[] = [
  { id: 'hair1', label: 'Buzz' },
  { id: 'hair2', label: 'Crew' },
  { id: 'hair3', label: 'Curly' },
  { id: 'hair4', label: 'Long' },
  { id: 'hair5', label: 'Bun' },
];

export const HAIR_COLORS: SwatchOption[] = [
  { id: 'hc1', color: '#1E1B18', label: 'Black' },
  { id: 'hc2', color: '#4A3222', label: 'Brown' },
  { id: 'hc3', color: '#8C5A2B', label: 'Chestnut' },
  { id: 'hc4', color: '#C98A3D', label: 'Blond' },
  { id: 'hc5', color: '#A44F3C', label: 'Auburn' },
];

/** Base gear auto-equipped at creation (spec §5 step 4, §10). */
export const BASE_EQUIPPED: Record<string, string> = {
  shirt: 'baseShirt',
  pants: 'basePants',
  backpack: 'baseBackpack',
};

export const DEFAULT_AVATAR: Required<
  Pick<AvatarConfig, 'skinTone' | 'eyes' | 'hair' | 'hairColor'>
> = {
  skinTone: 'skin2',
  eyes: 'eyes1',
  hair: 'hair2',
  hairColor: 'hc2',
};

export function swatchById(options: SwatchOption[], id: string | undefined) {
  return options.find((o) => o.id === id) ?? options[0];
}

/**
 * Registry slot names for the base-variant layer art (M12 naming
 * convention): body master per skin tone, eyes variant, hair style × color.
 * Resolved via getAssetOrNull — a name whose art hasn't landed yet (eyes /
 * hair before the batch pass) skips that layer and the frozen base's baked
 * features show. Unknown config ids fall back like the pickers do.
 */
export function baseLayerSlotNames(config: AvatarConfig): {
  body: string;
  eyes: string;
  hair: string;
} {
  const skin = swatchById(SKIN_TONES, config.skinTone).id;
  const eyes = (EYES.find((o) => o.id === config.eyes) ?? EYES[0]).id;
  const hair = (HAIR_STYLES.find((o) => o.id === config.hair) ?? HAIR_STYLES[0]).id;
  const hairColor = swatchById(HAIR_COLORS, config.hairColor).id;
  return {
    body: `bodySkin${skin.slice('skin'.length)}`,
    eyes: `baseEyes${eyes.slice('eyes'.length)}`,
    hair: `baseHair${hair.slice('hair'.length)}Hc${hairColor.slice('hc'.length)}`,
  };
}
