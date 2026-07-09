/**
 * Avatar compositor framing (pure, unit-tested): every layer is a full
 * 1024² registered image, so compositing is a plain stack — but a preview
 * box shouldn't show the whole mostly-empty canvas. The frame is the
 * canvas region worth showing: the frozen body's box, widened by the
 * anchor zone of any worn slot that extends past it (the pet sits beside
 * the body). All layers share one contain-fit rect computed from it.
 */
import { ANCHOR_CANVAS, ANCHOR_ZONES, BODY_BOX, type AnchorZone } from './anchorZones';
import type { CosmeticSlot } from './layers';

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Canvas-space region to show for a set of worn cosmetic slots. */
export function frameFor(wornSlots: readonly CosmeticSlot[]): AnchorZone {
  let [x0, x1] = BODY_BOX.x;
  let [y0, y1] = BODY_BOX.y;
  for (const slot of wornSlots) {
    const zone = ANCHOR_ZONES[slot];
    x0 = Math.min(x0, zone.x[0]);
    x1 = Math.max(x1, zone.x[1]);
    y0 = Math.min(y0, zone.y[0]);
    y1 = Math.max(y1, zone.y[1]);
  }
  return { x: [x0, x1], y: [y0, y1] };
}

/**
 * Where the 1024² canvas must be drawn (in stage coordinates) so `frame`
 * contain-fits, centered, inside a stage of `stageWidth` × `stageHeight`.
 * Every layer <Image> gets this same rect — registration does the rest.
 */
export function canvasRect(frame: AnchorZone, stageWidth: number, stageHeight: number): Rect {
  const frameWidth = frame.x[1] - frame.x[0];
  const frameHeight = frame.y[1] - frame.y[0];
  const scale = Math.min(stageWidth / frameWidth, stageHeight / frameHeight);
  const frameCenterX = (frame.x[0] + frame.x[1]) / 2;
  const frameCenterY = (frame.y[0] + frame.y[1]) / 2;
  return {
    left: stageWidth / 2 - frameCenterX * scale,
    top: stageHeight / 2 - frameCenterY * scale,
    width: ANCHOR_CANVAS * scale,
    height: ANCHOR_CANVAS * scale,
  };
}
