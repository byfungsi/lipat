import { animate } from "motion";
import { getEntranceEasing } from "@lipat-internal/model";
import type { SlidePlaybackDriver } from "@lipat-internal/model";
import { createSvgPlaybackDriver } from "@lipat-internal/browser-playback";
import type { BrowserPlaybackOptions } from "@lipat-internal/browser-playback";
/** Reduced motion follows the OS by default; an explicit policy supports kiosk/test hosts. */
export interface MotionPlaybackOptions extends BrowserPlaybackOptions {}
/** Optional Motion implementation shares browser reveal, style ownership and reduced motion semantics with the built-in player. */
export function createMotionPlayback(
  options: MotionPlaybackOptions = {},
): SlidePlaybackDriver<HTMLElement> {
  return createSvgPlaybackDriver(
    (target, animation, transforms) =>
      animate(
        target,
        {
          opacity: [0, 1],
          ...(transforms
            ? { transform: [transforms.initial, transforms.rest] }
            : {}),
        },
        {
          duration: (animation.durationMs ?? 350) / 1000,
          delay: (animation.delayMs ?? 0) / 1000,
          ease: getEntranceEasing(animation.easing),
        },
      ),
    options,
  );
}
