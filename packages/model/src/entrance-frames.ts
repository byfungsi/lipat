import type { EntranceAnimation } from "./deck-document";
/** Initial portable entrance transform uses slide points, uniform scale and opacity; every effect settles at zero translation, scale one and opacity one. */
export function getEntranceInitialFrame(effect: EntranceAnimation["effect"]): {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly opacity: number;
} {
  switch (effect) {
    case "fade":
      return { x: 0, y: 0, scale: 1, opacity: 0 };
    case "rise":
      return { x: 0, y: 24, scale: 1, opacity: 0 };
    case "slide":
      return { x: -32, y: 0, scale: 1, opacity: 0 };
    case "zoom":
      return { x: 0, y: 0, scale: 0.95, opacity: 0 };
  }
}
/** Cubic Bézier control points are shared by browser and native players; PPTX exports retain their documented approximation. */
export function getEntranceEasing(
  easing: EntranceAnimation["easing"],
): "linear" | readonly [number, number, number, number] {
  return easing === "linear"
    ? "linear"
    : easing === "easeInOut"
      ? [0.77, 0, 0.175, 1]
      : [0.23, 1, 0.32, 1];
}
