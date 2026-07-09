import { ANCHOR_CANVAS, ANCHOR_ZONES, BODY_BOX } from '../anchorZones';
import { canvasRect, frameFor } from '../frame';

describe('frameFor', () => {
  it('is exactly the body box when nothing worn extends past it', () => {
    expect(frameFor([])).toEqual(BODY_BOX);
    // torso slots nest inside the body silhouette's box
    expect(frameFor(['shirts', 'pants'])).toEqual(BODY_BOX);
  });

  it('extends right for a worn pet (companion sits beside the body)', () => {
    const frame = frameFor(['pet']);
    expect(frame.x[1]).toBe(ANCHOR_ZONES.pet.x[1]);
    expect(frame.y[1]).toBe(ANCHOR_ZONES.pet.y[1]);
    expect(frame.x[0]).toBe(BODY_BOX.x[0]);
  });

  it('extends up for a worn hat (brims rise past the crown)', () => {
    const frame = frameFor(['hats']);
    expect(frame.y[0]).toBe(ANCHOR_ZONES.hats.y[0]);
    expect(frame.y[1]).toBe(BODY_BOX.y[1]);
  });
});

describe('canvasRect', () => {
  it('maps the whole canvas onto a same-aspect stage 1:1', () => {
    const rect = canvasRect(
      { x: [0, ANCHOR_CANVAS], y: [0, ANCHOR_CANVAS] },
      100,
      100,
    );
    expect(rect).toEqual({ left: 0, top: 0, width: 100, height: 100 });
  });

  it('contain-fits and centers the frame on the stage', () => {
    const frame = frameFor([]);
    const [stageW, stageH] = [72, 200];
    const rect = canvasRect(frame, stageW, stageH);
    const scale = rect.width / ANCHOR_CANVAS;
    // contain: scale is the tighter of the two axis ratios
    expect(scale).toBeCloseTo(
      Math.min(stageW / (frame.x[1] - frame.x[0]), stageH / (frame.y[1] - frame.y[0])),
    );
    // the frame's center lands on the stage's center
    const frameCenterX = (frame.x[0] + frame.x[1]) / 2;
    const frameCenterY = (frame.y[0] + frame.y[1]) / 2;
    expect(rect.left + frameCenterX * scale).toBeCloseTo(stageW / 2);
    expect(rect.top + frameCenterY * scale).toBeCloseTo(stageH / 2);
  });
});
