/**
 * LOCKED-ON-BASE anchor zones (Rig Bible §5): traced from the frozen hiker
 * master, single source of truth in `assets/art/anchor-zones.json` (shared
 * with the intake scripts). Zones are containment boxes for generated
 * layers; referenceLines are the exact base landmarks (crown line, eye
 * line, …) each layer aligns to. Runtime compositing needs none of this —
 * every layer is a full-canvas registered image — these exist for the dev
 * QA overlay and intake validation.
 */
import zonesJson from '@/assets/art/anchor-zones.json';

import type { CosmeticSlot } from './layers';

/** Base variant layers have zones too (not cosmetic slots). */
export type AnchorSlot = CosmeticSlot | 'hair' | 'eyes';

export interface AnchorZone {
  /** [min, max] on the 1024² master canvas. */
  x: [number, number];
  y: [number, number];
}

export const ANCHOR_CANVAS: number = zonesJson.canvas;

export const REFERENCE_LINES = zonesJson.referenceLines as Readonly<
  Record<keyof typeof zonesJson.referenceLines, number>
>;

export const ANCHOR_ZONES = zonesJson.zones as Readonly<Record<AnchorSlot, AnchorZone>>;

/** The frozen base body's own content box on the master canvas. */
export const BODY_BOX = zonesJson.bodyBox as AnchorZone;
