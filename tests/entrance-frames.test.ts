import { expect, it } from "vitest";
import fc from "fast-check";
import {
  getEntranceInitialFrame,
  getEntranceEasing,
} from "@byfungsi/lipat/model";
it("shares point-based preset direction, scale and valid easing curves across players", () => {
  expect(getEntranceInitialFrame("slide")).toEqual({
    x: -32,
    y: 0,
    scale: 1,
    opacity: 0,
  });
  expect(getEntranceInitialFrame("rise").y).toBe(24);
  expect(getEntranceInitialFrame("zoom").scale).toBe(0.95);
  fc.assert(
    fc.property(fc.constantFrom("fade", "rise", "slide", "zoom"), (effect) => {
      const frame = getEntranceInitialFrame(effect);
      expect(Number.isFinite(frame.x) && Number.isFinite(frame.y)).toBe(true);
      expect(frame.scale).toBeGreaterThan(0);
      expect(frame.opacity).toBe(0);
    }),
  );
  expect(getEntranceEasing("linear")).toBe("linear");
  expect(getEntranceEasing("easeOut")).toEqual([0.23, 1, 0.32, 1]);
  expect(getEntranceEasing("easeInOut")).toEqual([0.77, 0, 0.175, 1]);
});
